const Joi = require('joi');

exports.registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).trim().required(),
  firstName: Joi.string().min(2).max(50).trim().required(),
  lastName: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
  phoneNumber: Joi.string().min(7).max(15).trim().optional().allow(''),
  role: Joi.string().valid('user', 'admin').optional(),
});


exports.loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
});