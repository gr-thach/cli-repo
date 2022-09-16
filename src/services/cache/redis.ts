import Redis from 'ioredis';
import DefaultCache from './default';
import { env } from '../../../config';

export default class RedisCache extends DefaultCache {
  client: Redis;

  constructor() {
    super();

    if (env.IPV6) {
      this.client = new Redis({ family: 6, host: 'redis' });
    } else {
      this.client = new Redis(env.REDIS_URL);
    }
  }

  async get(key: string) {
    const result = await this.client.get(key);
    return result;
  }

  async set(key: string, value: string | number, expire: number) {
    await this.client.set(key, value);
    if (Number.isInteger(expire)) {
      await this.client.expire(key, expire);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
