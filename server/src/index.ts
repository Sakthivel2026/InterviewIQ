import app from './app';
import { env } from './config/env';

const PORT = Number(env.PORT) || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
┌─────────────────────────────────────────────────────────┐
│              InterviewIQ Express Server                 │
├─────────────────────────────────────────────────────────┤
│  Status:      ONLINE                                    │
│  Port:        ${PORT}                                      │
│  Environment: ${env.NODE_ENV.padEnd(41)} │
│  API Prefix:  /api/v1                                   │
└─────────────────────────────────────────────────────────┘
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
