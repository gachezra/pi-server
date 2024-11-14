class ValidationError extends Error {
    constructor(message, details) {
      super(message);
      this.name = 'ValidationError';
      this.details = details;
    }
  }
  
  const validators = {
    validatePayment(payment) {
      const errors = [];
      
      if (!payment.identifier) {
        errors.push('Payment identifier is required');
      }
      
      if (payment.transaction) {
        if (!payment.transaction.txid) {
          errors.push('Transaction ID is required');
        }
        if (!payment.transaction._link) {
          errors.push('Transaction link is required');
        }
      }
      
      if (errors.length > 0) {
        throw new ValidationError('Payment validation failed', errors);
      }
      
      return true;
    },
  
    validateOrder(order) {
      const errors = [];
      
      if (!order.pi_payment_id) {
        errors.push('Payment ID is required');
      }
      if (!order.product_id) {
        errors.push('Product ID is required');
      }
      if (!order.user) {
        errors.push('User ID is required');
      }
      
      if (errors.length > 0) {
        throw new ValidationError('Order validation failed', errors);
      }
      
      return true;
    }
  };
  
  module.exports = validators;