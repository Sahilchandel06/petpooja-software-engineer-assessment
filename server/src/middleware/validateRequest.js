export function validateRequest(schema, source = 'body') {
  return (request, _response, next) => {
    const result = schema.safeParse(request[source]);
    if (!result.success) {
      const error = new Error(result.error.issues.map((issue) => issue.message).join('; '));
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      return next(error);
    }

    request.validated = { ...request.validated, [source]: result.data };
    return next();
  };
}
