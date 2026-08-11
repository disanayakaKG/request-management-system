import express from 'express';
import { config } from './src/config/config';
import authRouter from './src/routes/auth';
import requestsRouter from './src/routes/requests';
import reportsRouter from './src/routes/reports';
import inventoryRouter from './src/routes/inventory';
import logsRouter from './src/routes/logs';
import { verifySmtp, sendTestEmail } from './src/services/email';
import { connectMongoDB, getMongoStatus } from './src/db/mongodb';

async function startServer() {
  const app = express();
  const PORT = config.port || 5000;

  // Connect to MongoDB Atlas
  await connectMongoDB();

  // Parse JSON bodies
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health API
  app.get('/api/health', (req, res) => {
    const mongoStatus = getMongoStatus();
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      mongodb: {
        configured: Boolean(config.mongoUri),
        connected: mongoStatus.connected,
        readyState: mongoStatus.readyState
      }
    });
  });

  // Email diagnostics
  app.get('/api/health/email', async (req, res) => {
    try {
      const smtpConfig = {
        host: config.smtp.host || '(not set)',
        port: config.smtp.port,
        user: config.smtp.user ? '***set***' : '(not set)',
        pass: config.smtp.pass ? '***set***' : '(not set)',
      };

      const verification = await verifySmtp();
      let testSend: any = null;
      const to = typeof req.query.to === 'string' ? req.query.to : null;
      if (to && verification.ok) {
        try {
          const info = await sendTestEmail(to);
          testSend = { sent: true, messageId: (info as any)?.messageId, accepted: (info as any)?.accepted };
        } catch (err: any) {
          testSend = { sent: false, error: err?.message || String(err), code: err?.code, response: err?.response };
        }
      }

      res.status(verification.ok ? 200 : 500).json({
        smtpConfig,
        verification,
        testSend
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || String(error) });
    }
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/requests', requestsRouter);
  app.use('/api/admin/reports', reportsRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/admin/logs', logsRouter);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Request Management Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('💥 Critical failure starting backend server:', err);
  process.exit(1);
});
