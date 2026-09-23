import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Tag } from '../tags/tag.entity';
import { Note } from './note.entity';

@Entity({ name: 'note_tags' })
export class NoteTag {
  @PrimaryColumn({ name: 'note_id', type: 'integer' })
  noteId!: number;

  @PrimaryColumn({ name: 'tag_id', type: 'integer' })
  tagId!: number;

  @ManyToOne(() => Note, (note) => note.noteTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note!: Note;

  @ManyToOne(() => Tag, (tag) => tag.noteTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
