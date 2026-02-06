const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  console.log('🔍 [VALIDATION MIDDLEWARE] Running validation');
  const errors = validationResult(req);
  console.log('Validation errors:', errors.isEmpty() ? 'NONE' : JSON.stringify(errors.array(), null, 2));

  if (!errors.isEmpty()) {
    console.log('❌ [VALIDATION] Failed, returning 400');
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  console.log('✅ [VALIDATION] Passed, continuing to controller');
  next();
};