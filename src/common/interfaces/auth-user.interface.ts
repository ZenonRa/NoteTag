import { UserRole } from '../enums/user-role.enum';

export interface AuthUser {
  userId: number;
  login: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: number;
  login: string;
  role: UserRole;
}
