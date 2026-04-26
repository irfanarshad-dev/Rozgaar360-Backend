import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use(helmet());
  app.use(cookieParser());

  // CORS Configuration - Environment-based
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = isProduction
    ? (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`
    ✅ Backend running on port ${port}
    📝 Environment: ${process.env.NODE_ENV ?? 'development'}
    🔒 CORS Origins: ${corsOrigins.join(', ')}
  `);
}
bootstrap().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
