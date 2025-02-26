import { createServer } from 'aws-serverless-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import serverlessExpress from '@vendia/serverless-express';

const expressApp = express();
let server: Server | undefined;
let seHandler: ((event: any, context: any) => Promise<any>) | undefined;

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

interface Event {
  requestContext?: {
    connectionContext?: any;
  };
}

function sanitizeEvent(event: Event) {
  if (event && event.requestContext && event.requestContext.connectionContext) {
    delete event.requestContext.connectionContext;
  }
  return event;
}

// Transforma el evento para que tenga las propiedades mínimas que se esperan (como httpMethod y path)
function transformEvent(event: any) {
  // Si el evento ya tiene httpMethod y path, lo dejamos
  if (!event.httpMethod && event.method) {
    event.httpMethod = event.method;
  }
  if (!event.path && event.url) {
    event.path = event.url;
  }
  if (!event.queryStringParameters && event.query) {
    event.queryStringParameters = event.query;
  }
  // Fuerza isBase64Encoded para evitar problemas con la serialización
  if (typeof event.isBase64Encoded === 'undefined') {
    event.isBase64Encoded = false;
  }
  return event;
}

async function getSeHandler() {
  await bootstrapServer();
  if (!seHandler) {
    seHandler = serverlessExpress({ app: expressApp });
  }
  return seHandler;
}

export default async function handler(event: any, context: any) {
  try {
    const transformedEvent = transformEvent(event);
    const sanitizedEvent = sanitizeEvent(transformedEvent);
    const se = await getSeHandler();
    return se(sanitizedEvent, context);
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
}
