import * as bcrypt from 'bcrypt';
import { EntityManager } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { NoteTag } from '../../notes/note-tag.entity';
import { Note } from '../../notes/note.entity';
import { Tag } from '../../tags/tag.entity';
import { User } from '../../users/user.entity';
import dataSource from '../data-source';

interface DemoUserData {
  login: string;
  password: string;
  role: UserRole;
}

async function ensureUser(manager: EntityManager, data: DemoUserData): Promise<User> {
  const repository = manager.getRepository(User);
  const existing = await repository.findOneBy({ login: data.login });
  if (existing) return existing;

  return repository.save(
    repository.create({
      login: data.login,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: data.role,
    }),
  );
}

async function ensureTag(manager: EntityManager, userId: number, name: string): Promise<Tag> {
  const repository = manager.getRepository(Tag);
  const existing = await repository.findOneBy({ userId, name });
  return existing ?? repository.save(repository.create({ userId, name }));
}

async function ensureNote(manager: EntityManager, userId: number, content: string): Promise<Note> {
  const repository = manager.getRepository(Note);
  const existing = await repository.findOneBy({ userId, content });
  return existing ?? repository.save(repository.create({ userId, content }));
}

async function ensureNoteTag(manager: EntityManager, noteId: number, tagId: number): Promise<void> {
  const repository = manager.getRepository(NoteTag);
  const existing = await repository.findOneBy({ noteId, tagId });
  if (!existing) await repository.save(repository.create({ noteId, tagId }));
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
    const clientPassword = process.env.SEED_CLIENT_PASSWORD ?? 'password123';

    await dataSource.transaction(async (manager) => {
      await ensureUser(manager, {
        login: 'demo_admin',
        password: adminPassword,
        role: UserRole.Admin,
      });
      const andrey = await ensureUser(manager, {
        login: 'demo_andrey',
        password: clientPassword,
        role: UserRole.Client,
      });
      const maria = await ensureUser(manager, {
        login: 'demo_maria',
        password: clientPassword,
        role: UserRole.Client,
      });

      const study = await ensureTag(manager, andrey.id, 'Учёба');
      const ideas = await ensureTag(manager, andrey.id, 'Идеи');
      const personal = await ensureTag(manager, maria.id, 'Личное');

      const exam = await ensureNote(manager, andrey.id, 'Подготовиться к экзамену по базам данных');
      const project = await ensureNote(
        manager,
        andrey.id,
        'Обсудить архитектуру NoteTag с командой',
      );
      const shopping = await ensureNote(manager, maria.id, 'Купить продукты после занятий');

      await ensureNoteTag(manager, exam.id, study.id);
      await ensureNoteTag(manager, project.id, study.id);
      await ensureNoteTag(manager, project.id, ideas.id);
      await ensureNoteTag(manager, shopping.id, personal.id);
    });

    console.log('Demo data is ready');
  } finally {
    await dataSource.destroy();
  }
}

void seed().catch(() => {
  console.error('Database seeding failed');
  process.exitCode = 1;
});
