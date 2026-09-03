export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

export function errorHandler(error, req, res, _next) {
  console.error('[Server Error]', error?.message || error);

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  if (error?.name === 'ZodError') {
    return res.status(400).json({
      error: 'Invalid request.',
      details: error.issues?.map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    });
  }

  const status = Number.isInteger(error?.status) ? error.status : 500;
  if (status >= 500) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
  return res.status(status).json({ error: error?.message || 'Request failed.' });
}
