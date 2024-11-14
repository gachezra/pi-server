const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (err.name === 'FirebaseError') {
      return res.status(err.code === 'permission-denied' ? 403 : 400).json({
        error: err.message
      });
    }
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: err.message,
        details: err.details
      });
    }
  
    if (err.isAxiosError) {
      return res.status(err.response?.status || 500).json({
        error: 'External API Error',
        message: err.response?.data?.message || err.message
      });
    }
  
    // Default error
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  };
  
  module.exports = errorHandler;