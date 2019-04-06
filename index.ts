import app from "./app";

app.listen({ port: process.env.PORT }, () =>
  console.log(`🚀 Server ready at http://localhost:3254`)
);