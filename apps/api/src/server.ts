import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, prisma } from './services/prisma.js';

const app = createApp();

async function startServer() {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`🚀 School ERP API server running on http://localhost:${config.port}`);
    console.log(`📡 Base API Prefix: ${config.apiPrefix}`);
    console.log(`🏥 Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
  });

  const shutdown = async () => {
    console.log('\n🛑 Gracefully shutting down School ERP server...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ PostgreSQL disconnected. Process exited.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
