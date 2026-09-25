import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../enums/user-role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('allows a route without role metadata', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) };
    const switchToHttp = vi.fn();
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp,
    } as unknown as ExecutionContext;
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(context)).toBe(true);
    expect(switchToHttp).not.toHaveBeenCalled();
  });

  it('denies an unauthenticated request when a role is required', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.Client]) };
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as unknown as ExecutionContext;
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies a client when admin role is required', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.Admin]) };
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.Client } }),
      }),
    } as unknown as ExecutionContext;
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows an admin when admin role is required', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue([UserRole.Admin]) };
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.Admin } }),
      }),
    } as unknown as ExecutionContext;
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(context)).toBe(true);
  });
});
