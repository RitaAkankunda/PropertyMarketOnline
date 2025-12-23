import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log the full error details
    console.error('========================================');
    console.error('[EXCEPTION FILTER] Error caught:');
    console.error('Status:', status);
    console.error('Path:', request.url);
    console.error('Method:', request.method);
    console.error('Message:', message);
    if (exception instanceof Error) {
      console.error('Error name:', exception.name);
      console.error('Error message:', exception.message);
      console.error('Stack trace:', exception.stack);
    }
    console.error('Full exception:', exception);
    console.error('========================================');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message || 'Internal server error',
      error: exception instanceof Error ? exception.message : 'Unknown error',
    });
  }
}

