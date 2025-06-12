// Mengimpor custom error untuk handling error client-side
const ClientError = require("../../exceptions/ClientError");

// Mengimpor schema untuk validasi payload delete authentication
const {
  DeleteAuthenticationPayloadSchema,
} = require("../../validator/authentications/schema");

class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService; // Service untuk mengelola refresh token (simpan, hapus, verifikasi)
    this._usersService = usersService; // Service untuk verifikasi username dan password
    this._tokenManager = tokenManager; // Utilitas untuk generate dan verifikasi JWT
    this._validator = validator; // Validator untuk validasi request payload

    // Binding context agar `this` tetap merujuk ke instance class saat digunakan sebagai route handler
    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler =
      this.deleteAuthenticationHandler.bind(this);
  }

  // Handler untuk login pengguna (menghasilkan accessToken dan refreshToken)
  async postAuthenticationHandler(request, h) {
    this._validator.validatePostAuthenticationPayload(request.payload); // Validasi input login
    const { username, password } = request.payload;
    const id = await this._usersService.verifyUserCredential(
      username,
      password
    ); // Verifikasi user

    const accessToken = this._tokenManager.generateAccessToken({ id }); // Buat access token
    const refreshToken = this._tokenManager.generateRefreshToken({ id }); // Buat refresh token

    await this._authenticationsService.addRefreshToken(refreshToken); // Simpan refresh token ke database

    const response = h.response({
      status: "success",
      message: "Authentication berhasil ditambahkan",
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
    response.code(201); // HTTP status 201 Created
    return response;
  }

  // Handler untuk memperbarui accessToken menggunakan refreshToken
  async putAuthenticationHandler(request, h) {
    this._validator.validatePutAuthenticationPayload(request.payload); // Validasi input

    const { refreshToken } = request.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken); // Pastikan refreshToken valid
    const { id } = this._tokenManager.verifyRefreshToken(refreshToken); // Ambil ID user dari token

    const accessToken = this._tokenManager.generateAccessToken({ id }); // Buat accessToken baru

    return {
      status: "success",
      message: "Authentication berhasil diperbarui",
      data: {
        accessToken,
      },
    };
  }

  // Handler untuk logout (menghapus refreshToken dari database)
  async deleteAuthenticationHandler(request, h) {
    this._validator.validateDeleteAuthenticationPayload(request.payload); // Validasi input

    const { refreshToken } = request.payload;
    await this._authenticationsService.verifyRefreshToken(refreshToken); // Pastikan token valid
    await this._authenticationsService.deleteRefreshToken(refreshToken); // Hapus token dari database

    return {
      status: "success",
      message: "Refresh token berhasil dihapus",
    };
  }
}

module.exports = AuthenticationsHandler;
