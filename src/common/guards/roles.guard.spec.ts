import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('denies a client when admin role is required', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([UserRole.Admin]) };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.Client } }),
      }),
    } as unknown as ExecutionContext;
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows an admin when admin role is required', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([UserRole.Admin]) };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.Admin } }),
      }),
    } as unknown as ExecutionContext;
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(context)).toBe(true);
  });
});
