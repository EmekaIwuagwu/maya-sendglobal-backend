import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/error-codes';

/**
 * Validate request body, query, or params using Zod schema
 */
export const validate =
  (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pass to error handler which will format Zod errors
        next(error);
      } else {
        next(new AppError('SYS_007', 400));
      }
    }
  };

/**
 * Validate multiple sources
 */
export const validateAll = (schemas: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new AppError('SYS_007', 400));
      }
    }
  };
};

export default validate;
