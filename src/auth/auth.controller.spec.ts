import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const service = { register: vi.fn(), login: vi.fn() };
  const controller = new AuthController(service as unknown as AuthService);

  it('passes registration data to the auth service', async () => {
    const dto = { login: 'andrey', password: 'password123' };
    const result = { id: 1, login: 'andrey', role: 'client', createdAt: new Date() };
    service.register.mockResolvedValue(result);

    await expect(controller.register(dto)).resolves.toBe(result);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('passes login data to the auth service', async () => {
    const dto = { login: 'andrey', password: 'password123' };
    service.login.mockResolvedValue({ accessToken: 'jwt' });

    await expect(controller.login(dto)).resolves.toEqual({ accessToken: 'jwt' });
    expect(service.login).toHaveBeenCalledWith(dto);
  });
});
