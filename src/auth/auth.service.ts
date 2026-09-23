import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../common/interfaces/auth-user.interface';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface PublicUser {
  id: number;
  login: string;
  role: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.createClient(dto.login, passwordHash);
    return this.toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByLoginWithPassword(dto.login);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid login or password');
    }
    const payload: JwtPayload = { sub: user.id, login: user.login, role: user.role };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }

  private toPublicUser(user: User): PublicUser {
    return { id: user.id, login: user.login, role: user.role, createdAt: user.createdAt };
  }
}
