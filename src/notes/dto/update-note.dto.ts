import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ example: 'Изменённый текст' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
