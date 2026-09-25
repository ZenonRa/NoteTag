import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

describe('TagsController', () => {
  const service = { findAll: vi.fn(), create: vi.fn(), remove: vi.fn() };
  const controller = new TagsController(service as unknown as TagsService);
  const user: AuthUser = { userId: 7, login: 'andrey', role: UserRole.Client };

  it('uses the authenticated user for listing tags', async () => {
    const query = { page: 1, limit: 20 };
    service.findAll.mockResolvedValue({ items: [] });

    await controller.findAll(user, query);

    expect(service.findAll).toHaveBeenCalledWith(7, query);
  });

  it('uses the authenticated user for creating and deleting tags', async () => {
    const dto = { name: 'Учёба' };
    service.create.mockResolvedValue({ id: 5 });
    service.remove.mockResolvedValue(undefined);

    await controller.create(user, dto);
    await controller.remove(user, 5);

    expect(service.create).toHaveBeenCalledWith(7, dto);
    expect(service.remove).toHaveBeenCalledWith(7, 5);
  });
});
