import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Log klasörünü oluştur
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    auth: 5,
    database: 6,
    security: 7
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
    auth: 'blue',
    database: 'cyan',
    security: 'red bold'
  }
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Log formatı
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console formatı (development için)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Meta bilgileri varsa ekle
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    // Stack trace varsa ekle
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Logger seviyesi belirleme
const getLogLevel = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    default:
      return 'debug';
  }
};

// Transport'ları oluştur
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [
    // Error logs - sadece error seviyesi
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: logFormat
    }),
    
    // Combined logs - tüm seviyeler
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: logFormat
    }),
    
    // Warn logs
    new winston.transports.File({
      filename: path.join(logDir, 'warn.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true,
      format: logFormat
    }),

    // Auth logs
    new winston.transports.File({
      filename: path.join(logDir, 'auth.log'),
      level: 'auth',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true,
      format: logFormat
    }),

    // Database logs
    new winston.transports.File({
      filename: path.join(logDir, 'database.log'),
      level: 'database',
      maxsize: 5242880, // 5MB
      maxFiles: 2,
      tailable: true,
      format: logFormat
    }),

    // Security logs
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      level: 'security',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: logFormat
    })
  ];

  // Development ortamında console'a da yaz
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // Production ortamında sadece error ve warn loglarını console'a yaz
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: 'warn'
      })
    );
  }

  return transports;
};

// Extended logger interface
interface ExtendedLogger extends winston.Logger {
  request: (message: string, meta?: any) => ExtendedLogger;
  database: (message: string, meta?: any) => ExtendedLogger;
  auth: (message: string, meta?: any) => ExtendedLogger;
  security: (message: string, meta?: any) => ExtendedLogger;
  performance: (message: string, meta?: any) => ExtendedLogger;
}

// Logger oluştur
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: customLevels.levels,
  format: logFormat,
  defaultMeta: { 
    service: 'blog-backend',
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid
  },
  transports: createTransports(),
  
  // Unhandled exceptions ve rejections'ı yakala
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],

  exitOnError: false
}) as ExtendedLogger;

// Özel log metodları ekle
logger.request = (message: string, meta?: any): ExtendedLogger => {
  logger.log('http', `[REQUEST] ${message}`, meta);
  return logger;
};

logger.database = (message: string, meta?: any): ExtendedLogger => {
  logger.log('database', `[DATABASE] ${message}`, meta);
  return logger;
};

logger.auth = (message: string, meta?: any): ExtendedLogger => {
  logger.log('auth', `[AUTH] ${message}`, meta);
  return logger;
};

logger.security = (message: string, meta?: any): ExtendedLogger => {
  logger.log('security', `[SECURITY] ${message}`, meta);
  return logger;
};

logger.performance = (message: string, meta?: any): ExtendedLogger => {
  logger.info(`[PERFORMANCE] ${message}`, meta);
  return logger;
};

// HTTP request logger middleware factory
export const createHttpLoggerMiddleware = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
      
      logger.log(logLevel, `${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: res.get('Content-Length') || 0,
        requestId: req.headers['x-request-id']
      });
    });
    
    next();
  };
};

// Stream for morgan compatibility
export const loggerStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  }
};

// Log rotation cleanup
const cleanupOldLogs = (): void => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 gün
  const now = Date.now();

  try {
    const files = fs.readdirSync(logDir);
    
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Old log file deleted: ${file}`);
      }
    });
  } catch (error) {
    logger.error('Log cleanup failed:', error);
  }
};

// Cleanup old logs daily
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // Her gün
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Logger shutting down...');
  logger.end();
});

export default logger;