import 'dotenv/config';
import { DataSource } from 'typeorm';
import { NoteTag } from '../notes/note-tag.entity';
import { Note } from '../notes/note.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'notetag',
  entities: [User, Note, Tag, NoteTag],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});

export default dataSource;
