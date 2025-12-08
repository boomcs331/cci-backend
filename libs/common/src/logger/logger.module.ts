import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        transport: {
          target: 'pino-pretty', // For human-readable console output
          options: {
            colorize: true, // Colorize the logs
            crlf: false, // Add a new line after each log
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss', //'SYS:yyyy-mm-dd HH:MM:ss', // 24h format with timezone
            ignore: 'pid,hostname,req,res', // Ignore certain fields in logs
            singleLine: true, // Display logs in a single line
            timestampKey: 'time', // Rename the timestamp field
            messageKey: 'msg', // Rename the message field
            ignoreElements: ['req'], // Ignore certain fields in logs
            timzone: 'UTC', // Set timezone to UTC
          },
        },
        customProps: (req, res) => ({
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
        }),
        customSuccessMessage: (req, res) =>
          `Request completed: ${req.method} ${req.url} -> ${res.statusCode}`,
        customErrorMessage: (req, res, err) =>
          `Request error: ${req.method} ${req.url} -> ${res.statusCode} (${err.message}) `,
      },
    }),
  ],
})
export class LoggerModule {}
