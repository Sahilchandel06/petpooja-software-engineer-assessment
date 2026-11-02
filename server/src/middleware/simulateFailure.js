export function simulateFailure(request, response, next) {
  if (request.get('x-simulate-fail') === 'true') {
    return response.status(500).json({
      error: {
        message: 'Simulated server failure',
        code: 'SIMULATED_FAILURE',
      },
    });
  }
  return next();
}
