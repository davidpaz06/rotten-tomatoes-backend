import { createServer, proxy } from 'aws-serverless-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Server } from 'http';

const expressApp = express();
let server: Server | undefined;

async function bootstrapServer(): Promise<Server> {
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
  try {
    const srv = await bootstrapServer();
    return proxy(srv, event, context, 'PROMISE').promise;
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
}
