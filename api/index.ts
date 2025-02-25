import { createServer, proxy } from 'aws-serverless-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Server } from 'http';

const expressApp = express();
let server: Server | undefined;

// filepath: /.../api/index.ts
async function bootstrapServer(): Promise<Server> {
  if (!server) {
    console.log('Inicializando NestJS...');
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    console.log('NestJS creado, inicializando app...');
    await app.init();
    console.log('App inicializada, creando servidor...');
    server = createServer(expressApp);
    console.log('Servidor creado');
  }
  return server;
}

export default async function handler(event: any, context: any) {
  try {
    const srv = await bootstrapServer();
    return proxy(srv, event, context, 'PROMISE').promise;
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
}
