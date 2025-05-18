class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postUserHandler = this.postUserHandler.bind(this);
    this.getUserByIdHandler = this.getUserByIdHandler.bind(this);
  }

  async postUserHandler(request, h) {
    try {
      this._validator.validatePostUserPayload(request.payload);
      const { username, password, fullname } = request.payload;
      const userId = await this._service.addUser({
        username,
        password,
        fullname,
      });
      const response = h.response({
        status: "success",
        message: "User berhasil ditambahkan",
        data: {
          userId,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getUserByIdHandler(request, h) {
    try {
      const { id } = request.params;
      const user = await this._service.getUserById(id);
      return {
        status: "success",
        data: {
          user,
        },
      };
    } catch (error) {
      return this._handleError(error);
    }
  }
}
module.exports = UsersHandler;
