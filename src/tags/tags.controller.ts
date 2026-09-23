import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './tag.entity';
import { TagsService } from './tags.service';

@ApiTags('tags')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT is missing or invalid' })
@ApiForbiddenResponse({ description: 'Client role required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Client)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'List current client tags' })
  @ApiOkResponse({ description: 'Paginated owned tags' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.tagsService.findAll(user.userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a tag for current client' })
  @ApiCreatedResponse({ description: 'Tag created' })
  @ApiConflictResponse({ description: 'Tag name already exists for current client' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTagDto): Promise<Tag> {
    return this.tagsService.create(user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an owned tag' })
  @ApiNoContentResponse({ description: 'Tag and its note links deleted; notes remain' })
  @ApiNotFoundResponse({ description: 'Tag not found or not owned by current client' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tagsService.remove(user.userId, id);
  }
}
