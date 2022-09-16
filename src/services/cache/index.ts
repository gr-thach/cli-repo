import RedisCache from './redis';
import DefaultCache from './default';

export default class Cache {
  provider: string;

  static instances: { [key: string]: DefaultCache };

  constructor(provider: string) {
    this.provider = provider;
    if (!Cache.instances) {
      Cache.instances = {};
    }
    if (!Cache.instances[provider]) {
      switch (provider) {
        case 'redis':
          Cache.instances[provider] = new RedisCache();
          break;
        default:
          Cache.instances[provider] = new DefaultCache(); // fallback
      }
    }
  }

  getInstance() {
    return Cache.instances[this.provider];
  }
}
