/* eslint-disable linebreak-style */
const jwt = require('jsonwebtoken');
const mysqlConnection = require('../database');

module.exports = (secret) => (req, resp, next) => {
  const { authorization } = req.headers;
  console.log(authorization);
  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      return next(403);
    }
    console.log(decodedToken);
    // TODO: Verificar identidad del usuario usando `decodeToken.uid`
    const sql = `SELECT * FROM users WHERE email = "${decodedToken.result[0].email}" `;
    mysqlConnection.query(sql, (error, result) => {
      if (error) throw error;
      if (result) {
        req.user = result[0];
        next();
      } else {
        next(404);
      }
    });
  });
};

module.exports.isAuthenticated = (req) => {
  // TODO: decidir por la informacion del request si la usuaria esta autenticada
  if (req.user) {
    return true;
  }
  return false;
};

module.exports.isAdmin = (req) => {
  // TODO: decidir por la informacion del request si la usuaria es admin
  if (req.user.isadmin) {
    return true;
  }
  return false;
};

module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
