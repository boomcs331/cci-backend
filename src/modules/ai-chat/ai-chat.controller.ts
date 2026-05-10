import { Body, Controller, Post } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';
import { AiChatRequestDto, AiChatResponseDto } from './dto/ai-chat.dto';

@Controller('ai')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat')
  async chat(@Body() body: AiChatRequestDto): Promise<AiChatResponseDto> {
    return await this.aiChatService.chat({
      message: body.message,
      history: body.history,
    });
  }
}
