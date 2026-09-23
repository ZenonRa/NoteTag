import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Текст заметки' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
