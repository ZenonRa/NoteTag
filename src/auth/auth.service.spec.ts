import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usersService = {
    createClient: jest.fn(),
    findByLoginWithPassword: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn() };
  const service = new AuthService(
    usersService as unknown as UsersService,
    jwtService as unknown as JwtService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('registers a client with a bcrypt hash and never returns the hash', async () => {
    usersService.createClient.mockImplementation((login: string, passwordHash: string) =>
      Promise.resolve({
        id: 1,
        login,
        passwordHash,
        role: UserRole.Client,
        createdAt: new Date('2026-01-01'),
      } as User),
    );

    const result = await service.register({ login: 'andrey', password: 'password123' });
    const savedHash = usersService.createClient.mock.calls[0][1] as string;

    expect(await bcrypt.compare('password123', savedHash)).toBe(true);
    expect(result).toEqual({
      id: 1,
      login: 'andrey',
      role: UserRole.Client,
      createdAt: new Date('2026-01-01'),
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('propagates 409 for a duplicate login', async () => {
    usersService.createClient.mockRejectedValue(new ConflictException('Login already exists'));
    await expect(
      service.register({ login: 'andrey', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a JWT after successful login', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);
    usersService.findByLoginWithPassword.mockResolvedValue({
      id: 7,
      login: 'andrey',
      passwordHash,
      role: UserRole.Client,
    });
    jwtService.signAsync.mockResolvedValue('token');

    await expect(service.login({ login: 'andrey', password: 'password123' })).resolves.toEqual({
      accessToken: 'token',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 7,
      login: 'andrey',
      role: UserRole.Client,
    });
  });

  it('returns 401 for an incorrect password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    usersService.findByLoginWithPassword.mockResolvedValue({ passwordHash });
    await expect(
      service.login({ login: 'andrey', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
