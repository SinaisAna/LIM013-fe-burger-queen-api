/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const express = require('express');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const routes = require('./routes');
const pkg = require('./package.json');

const { port, dbUrl, secret } = config;
const app = express();

// TODO: Conexión a la Base de Datos (MongoDB o MySQL)

const mysqlConnection = require('./database');

mysqlConnection.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log('db is connet');
  app.set('config', config);
  app.set('pkg', pkg);

  // parse application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(authMiddleware(secret));

  // Registrar rutas
  routes(app, (err) => {
    if (err) {
      throw err;
    }

    app.use(errorHandler);

    app.listen(port, () => {
      console.info(`App listening on port ${port}`);
    });
  });
});
