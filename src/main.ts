import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT);
  app.enableCors();
  // await app.listen(+port);

  app.getHttpAdapter().get('/', (req, res) => res.send({ message: 'Server Running Successfully!' }));

  await app.listen(port, '0.0.0.0');
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap();
