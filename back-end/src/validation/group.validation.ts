import * as Joi from 'joi';

import { ValidationSchema } from '../interface/validation-schema.interface';

export const CreateGroup: ValidationSchema = {
  body: {
    name: Joi.string().required(),
    number_of_weeks: Joi.number().required(),
    roll_states: Joi.string().valid('unmark', 'present', 'absent', 'late').required(),
    incidents: Joi.number().required(),
    ltmt: Joi.string().valid('>', '<').required(),
  }
}

export const UpdateGroup: ValidationSchema = {
  body: {
    id: Joi.number().required(),
    name: Joi.string().optional(),
    number_of_weeks: Joi.number().optional(),
    roll_states: Joi.string().valid('unmark', 'present', 'absent', 'late').optional(),
    incidents: Joi.number().optional(),
    ltmt: Joi.string().valid('>', '<').optional(),
  }
}