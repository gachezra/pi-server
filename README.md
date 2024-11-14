/pi-payment-backend

## Key Changes

1. Authentication & Sessions:
   - Replace express-session with Firebase Authentication
   - Use Firebase custom tokens for Pi Network integration
   - JWT-based session management through Firebase

2. Database:
   - Replace MongoDB with Firestore
   - Use Firebase Real-time Database for payment status tracking
   - Leverage Firebase Cloud Functions for payment webhooks

3. Security:
   - Firebase Authentication rules
   - Firestore security rules
   - Firebase App Check integration

## Database Structure (Firestore)

### Collections:

users/
  └── {uid}/
      ├── username: string
      ├── piUid: string
      ├── roles: array
      ├── lastLogin: timestamp
      └── accessToken: string

payments/
  └── {paymentId}/
      ├── status: string
      ├── amount: number
      ├── userId: string
      ├── productId: string
      ├── txid: string
      ├── created: timestamp
      └── updated: timestamp

products/
  └── {productId}/
      ├── name: string
      ├── price: number
      └── description: string

## Authentication Flow
1. User authenticates with Pi Network
2. Backend verifies Pi Network token
3. Create/update Firebase user
4. Issue Firebase custom token
5. Client authenticates with Firebase

## Payment Flow
1. Payment initiated → Create Firestore document
2. Payment approved → Update status & create blockchain transaction
3. Payment completed → Update status & verify blockchain
4. Real-time status updates via Firebase listeners

## Security Rules
Firestore security rules ensure:
- Users can only access their own data
- Payments can only be modified by admin or owner
- Products are read-only for users