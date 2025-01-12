const Hapi = require("@hapi/hapi");
const notes = require("./api/notes");
const NotesService = require("./services/inMemory/NotesService");
const NotesValidator = require("./validator/notes");

const init = async () => {
  const notesService = new NotesService();
  const server = Hapi.server({
    port: 3000,
    host: process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  try {
    await server.register({
      plugin: notes,
      options: {
        service: notesService,
        validator: NotesValidator,
      },
    });
  } catch (err) {
    console.error("Error registering plugin:", err);
  }

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
