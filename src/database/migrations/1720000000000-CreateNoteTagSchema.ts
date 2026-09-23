import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNoteTagSchema1720000000000 implements MigrationInterface {
  name = 'CreateNoteTagSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "login" character varying(100) NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" character varying(20) NOT NULL DEFAULT 'client',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_login" UNIQUE ("login"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('client', 'admin')),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notes_user_id" ON "notes" ("user_id")`);
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "name" character varying(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tags_user_id_name" UNIQUE ("user_id", "name"),
        CONSTRAINT "PK_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tags_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_tags_user_id" ON "tags" ("user_id")`);
    await queryRunner.query(`
      CREATE TABLE "note_tags" (
        "note_id" integer NOT NULL,
        "tag_id" integer NOT NULL,
        CONSTRAINT "PK_note_tags" PRIMARY KEY ("note_id", "tag_id"),
        CONSTRAINT "FK_note_tags_note" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_note_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_note_tags_tag_id" ON "note_tags" ("tag_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "note_tags"`);
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
