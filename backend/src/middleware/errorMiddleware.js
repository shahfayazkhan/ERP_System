const errorHandler = (err, req, res, next) => {
  console.error('API Error Stack:', err.stack || err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Sequelize Validation/Unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
