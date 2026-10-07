import { LoggerService } from '@nestjs/common';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class JsonLogger implements LoggerService {
  log(message: unknown, context?: string) {
    this.write('info', message, context);
  }

  fatal(message: unknown, context?: string) {
    this.write('error', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    trace?: string,
  ) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      service: 'sa-hall-api',
      ...(context ? { context } : {}),
      ...(typeof message === 'object' && message !== null
        ? message
        : { message: String(message) }),
      ...(trace && process.env.NODE_ENV !== 'production' ? { trace } : {}),
    };
    const serialized = JSON.stringify(payload);

    if (level === 'error') {
      process.stderr.write(`${serialized}\n`);
    } else {
      process.stdout.write(`${serialized}\n`);
    }
  }
}
