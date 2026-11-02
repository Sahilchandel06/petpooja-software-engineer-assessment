import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// Keep the initial middleware stack small and explicit for easy extension.
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use((_request, _response, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
});

// One response shape keeps API failures predictable for the client.
app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  response.status(status).json({
    error: {
      message: status === 500 ? 'Internal server error' : error.message,
      code: error.code || 'INTERNAL_SERVER_ERROR',
    },
  });
});

export default app;
