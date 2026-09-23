import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { Tag } from '../tags/tag.entity';
import { NoteTag } from './note-tag.entity';
import { Note } from './note.entity';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Tag, NoteTag]), AuthModule],
  controllers: [NotesController],
  providers: [NotesService, RolesGuard],
})
export class NotesModule {}
