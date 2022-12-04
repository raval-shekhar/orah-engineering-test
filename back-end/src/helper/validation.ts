import { NextFunction, Request, Response } from 'express';
import * as Joi from 'joi';

import { ValidationSchema } from '../interface/validation-schema.interface';

/**
 * Create an object composed of the picked object properties
 * 
 * @param {Record<string, any>} object
 * @param {string[]} keys
 * @returns {Object}
 */
 const Pick = (object: Record<string, any>, keys: string[]) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

/**
 * Validate Incoming request 
 * 
 * @param { ValidationSchema } schema - Joi validation Schema
 * @returns { Request } - request with validated body
 */
export const Validate = (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => {
  const validSchema = Pick(schema, ['params', 'query', 'body']);
  const object = Pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' } })
    .validate(object, { abortEarly: false });

  if (error) {
    return res.status(422).json({ error });
  }
  Object.assign(req, value);
  next();
}