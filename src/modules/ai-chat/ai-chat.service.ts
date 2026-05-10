import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiChatHistoryMessageDto } from './dto/ai-chat.dto';

type ChatRole = 'system' | 'user' | 'assistant';
type AiProvider = 'ollama' | 'openai';
type OllamaMessage = { role: ChatRole; content: string };

@Injectable()
export class AiChatService {
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private getProvider(): AiProvider {
    const raw = this.config.get<string>('AI_PROVIDER')?.trim().toLowerCase();
    if (raw === 'openai') return 'openai';
    return 'ollama';
  }

  private getClient(): { client: OpenAI; model: string } {
    const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Missing OPENAI_API_KEY (set it in cci-backend/.env)',
      );
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }

    return { client: this.client, model };
  }

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

    if (this.getProvider() === 'ollama') {
      return await this.chatWithOllama(messages);
    }

    const { client, model } = this.getClient();
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.4,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return { reply: '(no response)', model: completion.model ?? model };
    }

    return { reply, model: completion.model ?? model };
  }
}
