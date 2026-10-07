import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JsonLogger } from '../logging/json.logger.js';

interface ErrorBody {
  code?: string;
  message?: string | string[];
  fieldErrors?: unknown[];
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: JsonLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const response = isHttpException ? exception.getResponse() : undefined;
    const body: ErrorBody =
      typeof response === 'object' && response !== null
        ? (response as ErrorBody)
        : { message: typeof response === 'string' ? response : undefined };
    const publicMessage =
      statusCode >= 500 && !(isHttpException && body.code)
        ? 'حدث خطأ غير متوقع. حاول مرة أخرى لاحقاً.'
        : Array.isArray(body.message)
          ? 'تعذر التحقق من البيانات المرسلة.'
          : (body.message ?? 'تعذر إكمال الطلب.');

    if (!isHttpException) {
      this.logger.error(
        {
          event: 'unhandled_exception',
          requestId: request.id,
          route: request.routeOptions.url,
          statusCode,
          exceptionName:
            exception instanceof Error ? exception.name : 'UnknownException',
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (statusCode >= 500) {
      this.logger.warn({
        event: 'expected_http_exception',
        requestId: request.id,
        route: request.routeOptions.url,
        statusCode,
        code: body.code ?? this.defaultCode(statusCode),
      });
    }

    void reply.status(statusCode).send({
      statusCode,
      code: body.code ?? this.defaultCode(statusCode),
      message: publicMessage,
      ...(body.fieldErrors ? { fieldErrors: body.fieldErrors } : {}),
      requestId: request.id,
    });
  }

  private defaultCode(statusCode: number): string {
    if (statusCode === 400) return 'INVALID_REQUEST';
    if (statusCode === 401) return 'AUTHENTICATION_REQUIRED';
    if (statusCode === 403) return 'ACCESS_DENIED';
    if (statusCode === 404) return 'RESOURCE_NOT_FOUND';
    if (statusCode === 409) return 'CONFLICT';
    if (statusCode === 422) return 'VALIDATION_FAILED';
    if (statusCode === 429) return 'RATE_LIMITED';
    return 'INTERNAL_ERROR';
  }
}
