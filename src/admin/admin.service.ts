import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Paginated } from '../common/interfaces/paginated.interface';
import { Note } from '../notes/note.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';

export interface AdminUserResponse {
  id: number;
  login: string;
  role: string;
  createdAt: Date;
}

export interface StatsResponse {
  usersCount: number;
  notesCount: number;
  tagsCount: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async findUsers(query: PaginationQueryDto): Promise<Paginated<AdminUserResponse>> {
    const [users, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return {
      items: users.map(({ id, login, role, createdAt }) => ({ id, login, role, createdAt })),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async getStats(): Promise<StatsResponse> {
    const [usersCount, notesCount, tagsCount] = await Promise.all([
      this.usersRepository.count(),
      this.notesRepository.count(),
      this.tagsRepository.count(),
    ]);
    return { usersCount, notesCount, tagsCount };
  }
}
