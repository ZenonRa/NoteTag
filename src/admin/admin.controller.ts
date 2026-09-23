import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT is missing or invalid' })
@ApiForbiddenResponse({ description: 'Admin role required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List registered users without password hashes' })
  @ApiOkResponse({ description: 'Paginated users' })
  findUsers(@Query() query: PaginationQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get total users, notes and tags counts' })
  @ApiOkResponse({
    schema: { example: { usersCount: 100, notesCount: 850, tagsCount: 240 } },
  })
  getStats() {
    return this.adminService.getStats();
  }
}
