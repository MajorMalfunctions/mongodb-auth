const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const app = express();
var corsOptions = {
  origin: "http://localhost:8081"
};
const logger = require("morgan");
const morgan = require('morgan');

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "jepskie-session",
    secret: "secret_jep_c00kie", // should use as secret environment variable
    httpOnly: true
  })
);



const db = require("./app/models");
const Role = db.role;
  db.mongoose
    .connect(`mongodb+srv://Jepxkie420:GkuSXoQs5zwYAKsM@burglers.ewfnx.mongodb.net/burglers_burger`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
     })
    .then(() => {
      console.log(" (☞ﾟヮﾟ)☞ Mongo Runs💯 ☜(ﾟヮﾟ☜) ");
       initial();
    })
    .catch(err => {
      console.error("Connection error", err);
        console.log(" 😡😠 DB (⌐■_■) 🤯🙄", err);
      process.exit();
  });

  function initial() {
    Role.estimatedDocumentCount((err, count) => {
      if (!err && count === 0) {
        new Role({
          name: "user"
        }).save(err => {
          if (err) {
            console.log("error", err);
          }
          console.log("➕ 'user' to roles 🕺");
        });
        new Role({
          name: "moderator"
        }).save(err => {
          if (err) {
            console.log("error", err);
          }
          console.log("➕ 'moderator' to roles 🕵️‍♂️");
        });
        new Role({
          name: "admin"
        }).save(err => {
          if (err) {
            console.log("error", err);
          }
          console.log("➕ 'admin' to roles 🕴");
        });
      }
    });
  }

require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});
// set port, listen for requests
const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
  console.log(" ☜(ﾟヮﾟ☜) Now Connected (☞ﾟヮﾟ)☞ ")
    console.log(`Server is running on port ${PORT}❗❗❗.`);
});