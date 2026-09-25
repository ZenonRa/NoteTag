import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesController', () => {
  const service = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    attachTag: vi.fn(),
    detachTag: vi.fn(),
  };
  const controller = new NotesController(service as unknown as NotesService);
  const user: AuthUser = { userId: 7, login: 'andrey', role: UserRole.Client };

  it('uses the authenticated user for list and read operations', async () => {
    const query = { page: 1, limit: 20 };
    service.findAll.mockResolvedValue({ items: [] });
    service.findOne.mockResolvedValue({ id: 3 });

    await controller.findAll(user, query);
    await controller.findOne(user, 3);

    expect(service.findAll).toHaveBeenCalledWith(7, query);
    expect(service.findOne).toHaveBeenCalledWith(7, 3);
  });

  it('uses the authenticated user for create, update and delete operations', async () => {
    const createDto = { content: 'new' };
    const updateDto = { content: 'changed' };
    service.create.mockResolvedValue({ id: 3 });
    service.update.mockResolvedValue({ id: 3 });
    service.remove.mockResolvedValue(undefined);

    await controller.create(user, createDto);
    await controller.update(user, 3, updateDto);
    await controller.remove(user, 3);

    expect(service.create).toHaveBeenCalledWith(7, createDto);
    expect(service.update).toHaveBeenCalledWith(7, 3, updateDto);
    expect(service.remove).toHaveBeenCalledWith(7, 3);
  });

  it('uses the authenticated user for tag attachment and detachment', async () => {
    service.attachTag.mockResolvedValue({ noteId: 3, tagId: 5 });
    service.detachTag.mockResolvedValue(undefined);

    await controller.attachTag(user, 3, 5);
    await controller.detachTag(user, 3, 5);

    expect(service.attachTag).toHaveBeenCalledWith(7, 3, 5);
    expect(service.detachTag).toHaveBeenCalledWith(7, 3, 5);
  });
});
