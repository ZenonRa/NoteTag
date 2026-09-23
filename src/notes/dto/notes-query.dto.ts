import { BadRequestException } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class NotesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated positive tag IDs. A note must contain all selected tags.',
    example: '1,3,5',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !/^\d+(,\d+)*$/.test(value)) {
      throw new BadRequestException('tagIds must be comma-separated positive integers');
    }
    const ids = [...new Set(value.split(',').map(Number))];
    if (ids.some((id) => !Number.isSafeInteger(id) || id < 1)) {
      throw new BadRequestException('tagIds must be comma-separated positive integers');
    }
    return ids;
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  tagIds?: number[];
}
