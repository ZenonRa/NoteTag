import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('POST /auth/register returns 201 and excludes password hash', async () => {
    authService.register.mockResolvedValue({ id: 1, login: 'andrey', role: 'client' });
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ login: 'andrey', password: 'password123' })
      .expect(201);
    expect(response.body).toEqual({ id: 1, login: 'andrey', role: 'client' });
  });

  it('POST /auth/register rejects invalid input with 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ login: '', password: '123' })
      .expect(400);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('POST /auth/login returns an access token', async () => {
    authService.login.mockResolvedValue({ accessToken: 'jwt' });
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: 'andrey', password: 'password123' })
      .expect(200)
      .expect({ accessToken: 'jwt' });
  });
});
