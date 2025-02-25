import { createServer, proxy } from 'aws-serverless-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import serverlessExpress from '@vendia/serverless-express';

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

function sanitizeEvent(event: any) {
  if (event && event.requestContext && event.requestContext.connectionContext) {
    delete event.requestContext.connectionContext;
  }
  return event;
}

export default async function handler(event: any, context: any) {
  try {
    const srv = await bootstrapServer();
    const sanitizedEvent = sanitizeEvent(event);
    return serverlessExpress.proxy(srv, sanitizedEvent, context, 'PROMISE')
      .promise;
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
}
