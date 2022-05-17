import OmeggaPlugin, { OL, PS, PC } from "omegga";

type PlayerId = { id: string };
type User = { currency: number };

type Config = { decimalPlaces: number; prefix: string; baseCurrency: number };
type Storage = { [cur_uuid: string]: User };

export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  dependents: Set<string>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    this.dependents = new Set();
  }

  defaultUser(): User {
    return { currency: this.config.baseCurrency };
  }

  roundCurrency(amount: number): number {
    const pow = Math.pow(10, this.config.decimalPlaces ?? 0);
    return Math.round(amount * pow) / pow;
  }

  navigatePath(data: any, path: string[]): any {
    let nested = data;
    while (path.length > 1) {
      const [x] = path.splice(0, 1);
      nested = nested[x] ??= {};
    }
    return [nested, path[0]];
  }

  formatCurrency(amount: number): string {
    return (
      this.config.prefix +
      this.roundCurrency(amount).toFixed(this.config.decimalPlaces)
    );
  }

  async getData({ id }: PlayerId): Promise<User> {
    return (await this.store.get("cur_" + id)) ?? this.defaultUser();
  }

  async setData({ id }: PlayerId, data: User) {
    if ("currency" in data) data.currency = this.roundCurrency(data.currency);
    await this.store.set("cur_" + id, data);
  }

  async updateData({ id }: PlayerId, data: Partial<User>) {
    if ("currency" in data) data.currency = this.roundCurrency(data.currency);
    const baseData = (await this.store.get("cur_" + id)) ?? this.defaultUser();
    await this.store.set("cur_" + id, { ...baseData, ...data });
  }

  async getCurrency(pid: PlayerId): Promise<string> {
    const data = await this.getData(pid);
    return this.formatCurrency(data.currency ?? 0);
  }

  async init() {
    this.omegga.on("cmd:currency", async (speaker: string) => {
      this.omegga.whisper(
        speaker,
        `You currently have <color="ff0">${await this.getCurrency(
          this.omegga.getPlayer(speaker)
        )}</>.`
      );
    });

    return { registeredCommands: ["currency"] };
  }

  async pluginEvent(event: string, from: string, args: any[]) {
    if (!this.dependents.has(from)) {
      this.dependents.add(from);
      console.log(`Plugin "${from}" is interacting with the currency plugin`);
    }

    if (event === "get") {
      return await this.getData({ id: args[0] });
    } else if (event === "currency") {
      return await this.getCurrency({ id: args[0] });
    } else if (event.startsWith("get.")) {
      const data = await this.getData({ id: args[0] });
      const [nested, field] = this.navigatePath(
        data,
        event.substring(4).split(".")
      );
      return nested[field];
    } else if (event === "update") {
      await this.updateData({ id: args[0] }, args[1]);
    } else if (event.startsWith("set.")) {
      const data = await this.getData({ id: args[0] });
      const [nested, field] = this.navigatePath(
        data,
        event.substring(4).split(".")
      );
      nested[field] = args[1];
      await this.updateData({ id: args[0] }, data);
    } else if (event.startsWith("add.")) {
      const data = await this.getData({ id: args[0] });
      const [nested, field] = this.navigatePath(
        data,
        event.substring(4).split(".")
      );
      if (nested[field] == null || typeof nested[field] === "number") {
        if (typeof args[1] !== "number")
          return { error: "Must add a number to a number field" };
        nested[field] = (nested[field] ?? 0) + args[1];
      } else {
        return { error: "Cannot add to a field that is not a number" };
      }
      await this.updateData({ id: args[0] }, data);
      return nested[field];
    } else if (event.startsWith("push.")) {
      const data = await this.getData({ id: args[0] });
      const [nested, field] = this.navigatePath(
        data,
        event.substring(5).split(".")
      );
      if (nested[field] == null || Array.isArray(nested[field])) {
        (nested[field] ??= []).push(args[1]);
      } else {
        return { error: "Cannot add to a field that is not a number" };
      }
      await this.updateData({ id: args[0] }, data);
      return nested[field];
    } else if (event.startsWith("delete.")) {
      const data = await this.getData({ id: args[0] });
      const [nested, field] = this.navigatePath(
        data,
        event.substring(5).split(".")
      );
      if (nested === data && field in this.defaultUser()) {
        return { error: "Cannot delete a base field" };
      }
      const val = nested[field];
      delete nested[field];
      await this.setData({ id: args[0] }, data);
      return val;
    } else if (event.startsWith("format")) {
      if (typeof args[0] !== "number")
        return { error: "Argument to `format` must be a number" };
      return this.formatCurrency(Number(args[0]));
    } else if (event.startsWith("round")) {
      if (typeof args[0] !== "number")
        return { error: "Argument to `round` must be a number" };
      return this.roundCurrency(Number(args[0]));
    } else {
      return { error: "Invalid event " + event };
    }
  }

  async stop() {}
}
