import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateNoteDto } from './dto/create-note.dto';
import { NotesQueryDto } from './dto/notes-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponse, NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT is missing or invalid' })
@ApiForbiddenResponse({ description: 'Client role required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Client)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List current client notes, optionally filtered by all tag IDs' })
  @ApiOkResponse({ description: 'Paginated notes with tags' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: NotesQueryDto) {
    return this.notesService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one owned note' })
  @ApiOkResponse({ description: 'Owned note with tags' })
  @ApiNotFoundResponse({ description: 'Note not found or not owned by current client' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteResponse> {
    return this.notesService.findOne(user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a note for current client' })
  @ApiCreatedResponse({ description: 'Note created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNoteDto): Promise<NoteResponse> {
    return this.notesService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned note' })
  @ApiOkResponse({ description: 'Note updated' })
  @ApiNotFoundResponse({ description: 'Note not found or not owned by current client' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ): Promise<NoteResponse> {
    return this.notesService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an owned note' })
  @ApiNoContentResponse({ description: 'Note and its tag links deleted' })
  @ApiNotFoundResponse({ description: 'Note not found or not owned by current client' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.notesService.remove(user.userId, id);
  }

  @Post(':noteId/tags/:tagId')
  @ApiOperation({ summary: 'Attach an owned tag to an owned note' })
  @ApiCreatedResponse({ description: 'Tag link exists' })
  @ApiNotFoundResponse({ description: 'Note or tag not found/not owned' })
  attachTag(
    @CurrentUser() user: AuthUser,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ): Promise<{ noteId: number; tagId: number }> {
    return this.notesService.attachTag(user.userId, noteId, tagId);
  }

  @Delete(':noteId/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach an owned tag from an owned note' })
  @ApiNoContentResponse({ description: 'Tag link removed; tag remains' })
  @ApiNotFoundResponse({ description: 'Note or tag not found/not owned' })
  detachTag(
    @CurrentUser() user: AuthUser,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ): Promise<void> {
    return this.notesService.detachTag(user.userId, noteId, tagId);
  }
}
