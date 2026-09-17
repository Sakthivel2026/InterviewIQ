import app from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────────────┐
│              InterviewIQ Express Server                 │
├─────────────────────────────────────────────────────────┤
│  Status:      ONLINE                                    │
│  Port:        ${env.PORT}                                      │
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
