// src/redis/redis.service.ts
import { Injectable } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new IORedis({ host: '127.0.0.1', port: 6379 });
    this.client.on('connect', () => console.log('Connected to Redis'));
    this.client.on('error', (err) => console.error('Redis error', err));
  }

  getClient(): Redis {
    if (!this.client) throw new Error('Redis client not initialized');
    return this.client;
  }

  async getClientReady(): Promise<Redis> {
    if (!this.client) throw new Error('Redis client not initialized');
    if (this.client.status !== 'ready') {
      await new Promise<void>((resolve, reject) => {
        this.client.once('ready', () => resolve());
        this.client.once('error', (err) => reject(err));
      });
    }
    return this.client;
  }
}
