import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(helmet());
  app.use(cookieParser());
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  
  await app.listen(process.env.PORT ?? 3001);
  console.log(`Backend running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
