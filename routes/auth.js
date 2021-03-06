/* eslint-disable linebreak-style */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
// const router = require("express").Router();

const mysqlConnection = require('../database');

const { secret } = config;

/** @module auth */
module.exports = (app, nextMain) => {
  /**
   * @name /auth
   * @description Crea token de autenticación.
   * @path {POST} /auth
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @response {Object} resp
   * @response {String} resp.token Token a usar para los requests sucesivos
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @auth No requiere autenticación
   */
  app.post('/auth', (req, resp, next) => {
    const { email, password } = req.body;
    // eslint-disable-next-line no-empty
    if (!email || !password) {
      return next(400);
    }
    const sql = `SELECT * FROM users WHERE email = "${email}" `;
    mysqlConnection.query(sql, (error, result) => {
      if (error) throw error;
      if (!result) {
        return next(404);
      }
      if (result.length > 0) {
        const pass = bcrypt.compareSync(password, result[0].password);
        // const pass = password === result[0].password;
        if (pass) {
          // result.password = undefined;
          const jsontoken = jwt.sign({ result }, secret, {
            expiresIn: '1h',
          });
          resp.header('authorization', jsontoken);
          resp.status(200).json({
            success: 1,
            message: 'login successfully',
            token: jsontoken,
          });

          // resp.header('authorization', "token");
          // resp.status(200).json(result);
        } else {
          return next(404);
        }
      } else {
        return next(404);
      }
    });
  });

  // TODO: autenticar a la usuarix
  // next();
  return nextMain();
};
