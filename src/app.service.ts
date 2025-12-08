import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly Logger = new Logger(AppService.name);
  getHello(): string {
      this.Logger.warn(`TEST`);
    return 'Hello World!';
  }
}
