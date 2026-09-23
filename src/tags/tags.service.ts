import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Paginated } from '../common/interfaces/paginated.interface';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findAll(userId: number, query: PaginationQueryDto): Promise<Paginated<Tag>> {
    const [items, total] = await this.tagsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async create(userId: number, dto: CreateTagDto): Promise<Tag> {
    const tag = this.tagsRepository.create({ userId, name: dto.name });
    try {
      return await this.tagsRepository.save(tag);
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Tag with this name already exists');
      }
      throw error;
    }
  }

  async remove(userId: number, id: number): Promise<void> {
    const tag = await this.tagsRepository.findOneBy({ id, userId });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.tagsRepository.remove(tag);
  }
}
