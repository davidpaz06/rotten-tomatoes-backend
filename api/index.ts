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

async function getSeHandler() {
  // Espera a que se inicie la aplicación
  await bootstrapServer();
  if (!seHandler) {
    // Crea el handler a partir de la aplicación Express
    seHandler = serverlessExpress({ app: expressApp });
  }
  return seHandler;
}

export default async function handler(event: any, context: any) {
  try {
    const sanitizedEvent = sanitizeEvent(event);
    const se = await getSeHandler();
    // Llama al handler devuelto por serverlessExpress con el evento y el contexto
    return se(sanitizedEvent, context);
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
}
