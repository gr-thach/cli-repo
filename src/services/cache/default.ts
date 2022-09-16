/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */
export default class DefaultCache {
  async get(key: string): Promise<any> {
    console.log('Abstract method get of DefaultCache does nothing', key);
    return undefined;
  }

  async set(key: string, value: any, expire: number) {
    console.log('Abstract method set of DefaultCache does nothing', key, value, expire);
  }

  async del(key: string) {
    console.log('Abstract method del of DefaultCache does nothing', key);
  }
}
