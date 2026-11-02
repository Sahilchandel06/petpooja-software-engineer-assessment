// Express 4 does not forward rejected async route promises without this wrapper.
export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
