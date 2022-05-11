import OmeggaPlugin, { OL, PS, PC, OmeggaPlayer } from 'omegga';

type User = { currency: number };
const DEFAULT_USER: User = { currency: 0 };

type Config = { decimalPlaces: number };
type Storage = { [cur_uuid: string]: User };

export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  async getData({ id }: OmeggaPlayer): Promise<User> {
    return (await this.store.get('cur_' + id)) ?? DEFAULT_USER;
  }

  async setData({ id }: OmeggaPlayer, data: User) {
    await this.store.set('cur_' + id, data);
  }

  async updateData({ id }: OmeggaPlayer, data: Partial<User>) {
    const baseData = (await this.store.get('cur_' + id)) ?? DEFAULT_USER;
    await this.store.set('cur_' + id, { ...baseData, ...data });
  }

  async updateDataDelta({ id }: OmeggaPlayer, transform: (base: User) => User) {
    const baseData = (await this.store.get('cur_' + id)) ?? DEFAULT_USER;
    await this.store.set('cur_' + id, { ...baseData, ...transform(baseData) });
  }

  async init() {
    // Write your plugin!
    this.omegga.on('cmd:test', (speaker: string) => {
      this.omegga.broadcast(`Hello, ${speaker}!`);
    });

    return { registeredCommands: ['test'] };
  }

  async pluginEvent(event: string, from: string, ...args: any[]) {}

  async stop() {
    // Anything that needs to be cleaned up...
  }
}
