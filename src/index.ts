import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import logger from 'morgan';
import MongoStore from 'connect-mongo';
import { MongoClient } from 'mongodb';
import env from './environments';
import mountPaymentsEndpoints from './handlers/payments';
import mountUserEndpoints from './handlers/users';

// We must import typedefs for ts-node-dev to pick them up when they change (even though tsc would supposedly
// have no problem here)
// https://stackoverflow.com/questions/65108033/property-user-does-not-exist-on-type-session-partialsessiondata#comment125163548_65381085
import "./types/session";

const dbName = env.mongo_db_name;
const mongoUri = `mongodb://${env.mongo_host}/${dbName}`;
const mongoClientOptions = {
  authSource: "admin",
  auth: {
    username: env.mongo_user,
    password: env.mongo_password,
  },
}
let client: MongoClient;


//
// I. Initialize and set up the express app and various middlewares and packages:
//

const app: express.Application = express();

// Log requests to the console in a compact format:
app.use(logger('dev'));

// Full log of all requests to /log/access.log:
app.use(logger('common', {
  stream: fs.createWriteStream(path.join(__dirname, '..', 'log', 'access.log'), { flags: 'a' }),
}));

// Enable response bodies to be sent as JSON:
app.use(express.json())

// Handle CORS:
app.use(cors({
  origin: env.frontend_url,
  credentials: true
}));

// Handle cookies 🍪
app.use(cookieParser());

// Use sessions:
app.use(session({
  secret: env.session_secret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    mongoOptions: mongoClientOptions,
    dbName: dbName,
    collectionName: 'user_sessions'
  }),
}));


//
// II. Mount app endpoints:
//

// Payments endpoint under /payments:
const paymentsRouter = express.Router();
mountPaymentsEndpoints(paymentsRouter);
app.use('/payments', paymentsRouter);

// User endpoints (e.g signin, signout) under /user:
const userRouter = express.Router();
mountUserEndpoints(userRouter);
app.use('/user', userRouter);

// Hello World page to check everything works:
app.get('/', async (_, res) => {
  res.status(200).send({ message: "Hello, World!" });
});

app.get('/on', async (_, res) => {
  try {
    // Check MongoDB connection
    await app.locals.userCollection.stats();
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});


// III. Boot up the app:
// Improved MongoDB connection handling
async function connectToMongo(retries = 5, delay = 5000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      client = await MongoClient.connect(mongoUri);
      app.locals.orderCollection = client.db(dbName).collection('orders');
      app.locals.userCollection = client.db(dbName).collection('users');
      console.log('Successfully connected to MongoDB on:', env.mongo_host);
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, err);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to MongoDB after multiple attempts');
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal. Closing connections...');
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  try {
    await connectToMongo();
    console.log(`App listening on port ${PORT}`);
    console.log(`CORS config: configured to respond to a frontend hosted on ${env.frontend_url}`);
  } catch (err) {
    console.error('Failed to start application:', err);
    process.exit(1);
  }
});