import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('uses the configured secret and maps a payload to the request user', () => {
    const config = { getOrThrow: vi.fn().mockReturnValue('test-secret') };
    const strategy = new JwtStrategy(config as unknown as ConfigService);

    expect(config.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    expect(strategy.validate({ sub: 7, login: 'andrey', role: UserRole.Client })).toEqual({
      userId: 7,
      login: 'andrey',
      role: UserRole.Client,
    });
  });
});
