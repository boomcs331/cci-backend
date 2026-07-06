import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class AiChatHistoryMessageDto {
  @IsIn(['system', 'user', 'assistant'])
  role!: 'system' | 'user' | 'assistant';

  @IsString()
  @MaxLength(20_000)
  content!: string;
}

export class AiChatRequestDto {
  @IsString()
  @MaxLength(20_000)
  message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiChatHistoryMessageDto)
  history?: AiChatHistoryMessageDto[];
}

export class AiChatResponseDto {
  reply!: string;
  model!: string;
}
