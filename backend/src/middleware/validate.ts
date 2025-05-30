/**
 * Ultra-compact validation middleware with aggressive optimization
 */
import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { createValidationError } from '../utils/errors';

// Ultra-compact validation factory with inline operations and functional composition
export const validate = (schema: Schema, property = 'body') =>
  (req: Request & { [key: string]: any }, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });

    // Inline error handling with ternary and method chaining
    error
      ? next(createValidationError({ message: 'Validation failed' }, { details: error.details.map(({ message, path }) => ({ message, path })) }))
      : (req[property] = value, next());
  };

export default validate;
