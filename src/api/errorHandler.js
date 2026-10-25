const STATUS_BY_CODE = {
  INVALID_URL: 400,
  INVALID_ALIAS: 400,
  INVALID_EXPIRY: 400,
  ALIAS_TAKEN: 409,
  LINK_NOT_FOUND: 404,
  LINK_GONE: 410,
  CODE_GENERATION_FAILED: 503,
};

function errorBody(code, message) {
  return { error: { code, message } };
}

export function registerErrorHandler(app) {
  app.setErrorHandler((err, request, reply) => {
    const status = STATUS_BY_CODE[err.code];
    if (status) {
      return reply.status(status).send(errorBody(err.code, err.message));
    }

    if (err.validation) {
      return reply.status(400).send(errorBody("VALIDATION_ERROR", err.message));
    }

    if (err.statusCode >= 400 && err.statusCode < 500) {
      return reply.status(err.statusCode).send(errorBody("BAD_REQUEST", err.message));
    }

    request.log.error(err);
    return reply.status(500).send(errorBody("INTERNAL_ERROR", "Something went wrong."));
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send(errorBody("ROUTE_NOT_FOUND", "Route not found."));
  });
}