import { createServer, proxy } from 'aws-serverless-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

const expressApp = express();
let server: any;

async function bootstrapServer() {
  if (!server) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    // Opcional: configura pipes globales, middlewares, etc.
    await app.init();
    // Crea el servidor serverless usando aws-serverless-express
    server = createServer(expressApp);
  }
  return server;
}

export async function handler(event: any, context: any) {
  const srv = await bootstrapServer();
  return proxy(srv, event, context, 'PROMISE').promise;
}
