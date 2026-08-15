import dotenv from 'dotenv';
const result = dotenv.config({ override: true });

// Robust helper to strip any surrounding single or double quotes injected in .env
const cleanEnv = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

if (result.parsed) {
  console.log('📬 Environment variables loaded from .env');
} else {
  console.log('ℹ️ Operating with default/environment variables');
}

console.log('📧 Configured SMTP details:', {
  host: cleanEnv(process.env.SMTP_HOST),
  port: cleanEnv(process.env.SMTP_PORT),
  secure: cleanEnv(process.env.SMTP_SECURE) === 'true',
  user: cleanEnv(process.env.SMTP_USER) ? '***' : '(not set)',
  pass: (cleanEnv(process.env.SMTP_PASS) || cleanEnv(process.env.SMTP_PASSWORD)) ? '***' : '(not set)',
  fromName: cleanEnv(process.env.SMTP_FROM_NAME) || cleanEnv(process.env.SMTP_FROM) || 'Service Request Management System',
  fromEmail: cleanEnv(process.env.SMTP_FROM_EMAIL) || 'no-reply@requestsystem.com'
});

export const config = {
  port: parseInt(cleanEnv(process.env.PORT) || '5000', 10),
  jwtSecret: cleanEnv(process.env.JWT_SECRET) || 'request-mgt-system-super-jwt-token-secret-fallback-2026',
  smtp: {
    host: cleanEnv(process.env.SMTP_HOST) || 'sandbox.smtp.mailtrap.io',
    port: parseInt(cleanEnv(process.env.SMTP_PORT) || '2525', 10),
    secure: cleanEnv(process.env.SMTP_SECURE) === 'true',
    user: cleanEnv(process.env.SMTP_USER) || '',
    pass: cleanEnv(process.env.SMTP_PASS) || cleanEnv(process.env.SMTP_PASSWORD) || '',
    fromName: cleanEnv(process.env.SMTP_FROM_NAME) || cleanEnv(process.env.SMTP_FROM) || 'Service Request Management System',
    fromEmail: cleanEnv(process.env.SMTP_FROM_EMAIL) || 'no-reply@requestsystem.com'
  },
  appUrl: cleanEnv(process.env.APP_URL) || 'http://localhost:5000',
  frontendUrl: cleanEnv(process.env.FRONTEND_URL) || cleanEnv(process.env.APP_URL) || 'http://localhost:3000',
  mongoUri: cleanEnv(process.env.MONGODB_URI)
};
