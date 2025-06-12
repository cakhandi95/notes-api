// mengimpor dotenv dan menjalankan konfigurasinya
require("dotenv").config();

const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");

// Notes API
const notes = require("./api/notes");
const NotesService = require("./services/postgres/NotesService");
const NotesValidator = require("./validator/notes");
const ClientError = require("./exceptions/ClientError");

// Users API
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const usersValidator = require("./validator/users");

// Authentications API
const authentications = require("./api/authentications");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

const init = async () => {
  const notesService = new NotesService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();

  const authenticationsValidator = new AuthenticationsValidator();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  // registrasi plugin eksternal
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // mendefinisikan strategy autentikasi jwt
  server.auth.strategy("notesapp_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY, // merupakan key atau kunci dari token JWT-nya (di mana merupakan access token key)
    verify: {
      aud: false, //  nilai audience dari token, bila kita diberi nilai false itu berarti aud tidak akan diverifikasi.
      iss: false, // nilai issuer dari token, bila kita diberi nilai false itu berarti iss tidak akan diverifikasi.
      sub: false, // nilai subject dari token, bila kita diberi nilai false itu berarti sub tidak akan diverifikasi.
      maxAgeSec: process.env.ACCESS_TOKEN_AGE, //  nilai number yang menentukan umur kedaluwarsa dari token. Penentuan kedaluwarsa token dilihat dari nilai iat yang berada di payload token.
    },
    validate: (artifacts) => ({
      // merupakan fungsi yang membawa artifacts token. Fungsi ini dapat kita manfaatkan untuk menyimpan payload token--yang berarti kredensial pengguna--pada request.auth.
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: notes,
      options: {
        service: notesService,
        validator: NotesValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: usersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: authenticationsValidator,
      },
    },
  ]);

  server.ext("onPreResponse", (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;

    console.log(
      `masuk: ${response.statusCode} ${request.method} ${request.url.pathname}`
    );

    // penanganan client error secara internal.
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: "fail",
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
