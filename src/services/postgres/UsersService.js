const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const InvariantError = require("../../exceptions/InvariantError");

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    // TODO: Verifikasi username, pastikan belum terdaftar.
    await this.verifyNewUsername(username);
    // TODO: Bila verifikasi lolos, maka masukkan user baru ke database.
    const id = `user-${nanoid(16)}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = {
      text: "INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id",
      values: [id, username, hashedPassword, fullname],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("User gagal ditambahkan");
    }
    x;
    return result.rows[0].id;
  }

  async verifyNewUsername(username) {
    const query = {
      text: "SELECT username FROM users WHERE username = $1",
      values: [username],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError(
        "Gagal menambahkan user. Username sudah digunakan."
      );
    }
  }

  async verifyUserCredential(username, password) {
    const query = {
      text: "SELECT id FROM users WHERE username = $1 AND password = $2",
      values: [username, password],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError("Kredensial yang Anda masukkan salah");
    }

    return result.rows[0].id;
  }

  async getUserById(userId) {
    const query = {
      text: "SELECT id, username, fullname FROM users WHERE id = $1",
      values: [userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError("User tidak ditemukan");
    }

    return result.rows[0];
  }
}

module.exports = UsersService;
