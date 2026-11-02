import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[\da-f]{24}$/i, 'id must be a valid MongoDB ObjectId');

export function validateObjectId(parameterName = 'id') {
  return (request, _response, next) => {
    const result = objectIdSchema.safeParse(request.params[parameterName]);
    if (!result.success) {
      const error = new Error(result.error.issues[0].message);
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }
    return next();
  };
}
