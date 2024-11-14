const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');
const piNetwork = require('../services/piNetwork');
const validators = require('../utils/validators');
const firebase = require('../services/firebase');

// Handle incomplete payment
router.post('/incomplete', async (req, res) => {
  try {
    const payment = req.body.payment;
    validators.validatePayment(payment);
    
    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;
    const txURL = payment.transaction?._link;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(400).json({ message: "Payment not found" });
    }

    // Verify blockchain transaction
    const horizonResponse = await axios.create({ timeout: 20000 }).get(txURL);
    const paymentIdOnBlock = horizonResponse.data.memo;

    if (paymentIdOnBlock !== paymentId) {
      return res.status(400).json({ message: "Payment ID mismatch" });
    }

    // Update using transaction
    await firebase.executeTransaction(async (transaction) => {
      await transaction.update(db.collection('payments').doc(paymentId), {
        status: 'completed',
        txid,
        updated: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await piNetwork.completePayment(paymentId, txid);
    res.json({ message: `Handled incomplete payment ${paymentId}` });
  } catch (error) {
    next(error);
  }
});

// Handle cancelled payment
router.post('/cancelled_payment', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    await firebase.executeTransaction(async (transaction) => {
      await transaction.update(db.collection('payments').doc(paymentId), {
        status: 'cancelled',
        updated: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ message: `Cancelled payment ${paymentId}` });
  } catch (error) {
    next(error);
  }
});

router.post('/approve', authenticateUser, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await piNetwork.verifyPayment(paymentId);
    
    // Create payment document
    await db.collection('payments').doc(paymentId).set({
      status: 'approved',
      amount: payment.amount,
      userId: req.user.uid,
      productId: payment.metadata.productId,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    });

    await piNetwork.client.post(`/v2/payments/${paymentId}/approve`);
    res.json({ message: 'Payment approved' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/complete', authenticateUser, async (req, res) => {
  try {
    const { paymentId, txid } = req.body;
    
    // Update payment status
    await db.collection('payments').doc(paymentId).update({
      status: 'completed',
      txid,
      updated: new Date().toISOString()
    });

    await piNetwork.completePayment(paymentId, txid);
    res.json({ message: 'Payment completed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;