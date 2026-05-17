import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiChatHistoryMessageDto } from './dto/ai-chat.dto';

type ChatRole = 'system' | 'user' | 'assistant';
type OllamaMessage = { role: ChatRole; content: string };

@Injectable()
export class AiChatService {
  constructor(private readonly config: ConfigService) {}

  private async chatWithOllama(messages: OllamaMessage[]): Promise<{
    reply: string;
    model: string;
  }> {
    const baseUrl =
      this.config.get<string>('OLLAMA_BASE_URL')?.trim() ??
      'http://127.0.0.1:11434';
    const model = this.config.get<string>('OLLAMA_MODEL') ?? 'llama3.1:8b';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Ollama request failed (${response.status}): ${errorText || 'unknown error'}`,
      );
    }

    const payload = (await response.json()) as {
      message?: { content?: string };
      model?: string;
    };

    const reply = payload.message?.content?.trim();
    return {
      reply: reply || '(no response)',
      model: payload.model ?? model,
    };
  }

  async chat(params: {
    message: string;
    history?: AiChatHistoryMessageDto[];
  }): Promise<{ reply: string; model: string }> {
    const systemPrompt =
      this.config.get<string>('AI_SYSTEM_PROMPT') ??
      'You are a helpful assistant. Reply in Thai unless the user asks otherwise.';

    const history = (params.history ?? [])
      .filter((m) => m && typeof m.content === 'string' && m.content.trim() !== '')
      .slice(-20)
      .map((m) => ({
        role: m.role as ChatRole,
        content: m.content,
      }));

    const messages: OllamaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: params.message },
    ];

    return await this.chatWithOllama(messages);
  }
}
