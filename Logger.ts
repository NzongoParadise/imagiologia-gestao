// src/infrastructure/logging/Logger.ts
export class Logger {
  private static instance: Logger;

  // Retorna uma instância singleton do Logger
  static getLogger(filename: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    // Em um sistema mais complexo, 'filename' poderia ser usado para configurar loggers específicos
    return Logger.instance;
  }

  info(message: string, data?: Record<string, unknown>): void {
    console.log(JSON.stringify({
      level: "INFO",
      timestamp: new Date().toISOString(),
      message,
      ...data,
    }));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(JSON.stringify({
      level: "WARN",
      timestamp: new Date().toISOString(),
      message,
      ...data,
    }));
  }

  error(message: string, error: unknown, data?: Record<string, unknown>): void {
    console.error(JSON.stringify({
      level: "ERROR",
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...data,
    }));
  }
}