const fs = require('fs/promises');
const path = require('path');

class UserRepository {
  constructor(config) {
    this.filePath = path.resolve(process.cwd(), config.app.storage.filePath);
    this.writeChain = Promise.resolve();
  }

  async ensureStore() {
    const directory = path.dirname(this.filePath);
    await fs.mkdir(directory, { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch (_error) {
      await fs.writeFile(this.filePath, JSON.stringify({ users: [] }, null, 2), 'utf8');
    }
  }

  async readStore() {
    await this.ensureStore();
    const content = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(content);
  }

  async writeStore(store) {
    this.writeChain = this.writeChain.then(() =>
      fs.writeFile(this.filePath, JSON.stringify(store, null, 2), 'utf8')
    );

    await this.writeChain;
  }

  async findById(id) {
    const store = await this.readStore();
    return store.users.find((user) => user.id === id) || null;
  }

  async findByEmailNormalized(emailNormalized) {
    const store = await this.readStore();
    return store.users.find((user) => user.emailNormalized === emailNormalized) || null;
  }

  async findByUsernameNormalized(usernameNormalized) {
    const store = await this.readStore();
    return store.users.find((user) => user.usernameNormalized === usernameNormalized) || null;
  }

  async findByIdentifier(identifierNormalized) {
    const store = await this.readStore();

    return (
      store.users.find(
        (user) =>
          user.emailNormalized === identifierNormalized ||
          user.usernameNormalized === identifierNormalized
      ) || null
    );
  }

  async create(user) {
    const store = await this.readStore();
    store.users.push(user);
    await this.writeStore(store);
    return user;
  }
}

module.exports = {
  UserRepository
};

