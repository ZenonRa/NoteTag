import { describe, expect, it, vi } from 'vitest';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  const service = { findUsers: vi.fn(), getStats: vi.fn() };
  const controller = new AdminController(service as unknown as AdminService);

  it('passes pagination to the users listing', async () => {
    const query = { page: 2, limit: 10 };
    service.findUsers.mockResolvedValue({ items: [], page: 2, limit: 10, total: 0, totalPages: 0 });

    await controller.findUsers(query);

    expect(service.findUsers).toHaveBeenCalledWith(query);
  });

  it('returns system statistics', async () => {
    const stats = { usersCount: 2, notesCount: 3, tagsCount: 4 };
    service.getStats.mockResolvedValue(stats);

    await expect(controller.getStats()).resolves.toBe(stats);
  });
});
