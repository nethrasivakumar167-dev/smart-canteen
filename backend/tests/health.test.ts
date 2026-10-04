import request from 'supertest';
import app from '../src/app';

describe('GET /api/health', () => {
  it('should return 200 with service status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'online',
        service: 'Smart Canteen API',
        timestamp: expect.any(String),
        version: '1.0.0',
        environment: expect.any(String),
      })
    );
  });
});