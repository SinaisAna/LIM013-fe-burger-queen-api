/* eslint-disable linebreak-style */
const bcrypt = require('bcrypt');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const {
  getUsers,
} = require('../controller/users');

const {
  validateEmail,
  validatePassword,
} = require('../lib/validator');

const {
  getDataById,
  createData,
  updateDataById,
  deleteData,
  getDataByEmail,
  getAllData,
} = require('../controller/sql_query');

const initAdminUser = (app, next) => {
  const { adminEmail, adminPassword } = app.get('config');
  if (!adminEmail || !adminPassword) {
    return next();
  }
  const rolesObj = { admin: true };
  const adminUser = {
    email: adminEmail,
    password: bcrypt.hashSync(adminPassword, 10),
    roles: JSON.stringify(rolesObj),
  };
  // TODO: crear usuaria admin
  getAllData('users')
    .then(() => next())
    .catch(() => {
      createData('users', adminUser)
        .then(() => {
          next();
        });
    });
};

/*
 * Diagrama de flujo de una aplicación y petición en node - express :
 *
 * request  -> middleware1 -> middleware2 -> route
 *                                             |
 * response <- middleware4 <- middleware3   <---
 *
 * la gracia es que la petición va pasando por cada una de las funciones
 * intermedias o "middlewares" hasta llegar a la función de la ruta, luego esa
 * función genera la respuesta y esta pasa nuevamente por otras funciones
 * intermedias hasta responder finalmente a la usuaria.
 *
 * Un ejemplo de middleware podría ser una función que verifique que una usuaria
 * está realmente registrado en la aplicación y que tiene permisos para usar la
 * ruta. O también un middleware de traducción, que cambie la respuesta
 * dependiendo del idioma de la usuaria.
 *
 * Es por lo anterior que siempre veremos los argumentos request, response y
 * next en nuestros middlewares y rutas. Cada una de estas funciones tendrá
 * la oportunidad de acceder a la consulta (request) y hacerse cargo de enviar
 * una respuesta (rompiendo la cadena), o delegar la consulta a la siguiente
 * función en la cadena (invocando next). De esta forma, la petición (request)
 * va pasando a través de las funciones, así como también la respuesta
 * (response).
 */

/** @module users */
module.exports = (app, next) => {
  /**
   * @name GET /users
   * @description Lista usuarias
   * @path {GET} /users
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @response {Array} users
   * @response {String} users[]._id
   * @response {Object} users[].email
   * @response {Object} users[].roles
   * @response {Boolean} users[].roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin
   */
  app.get('/users', requireAdmin, (req, resp, next) => {
    getUsers(req, resp, next);
  });

  /**
   * @name GET /users/:uid
   * @description Obtiene información de una usuaria
   * @path {GET} /users/:uid
   * @params {String} :uid `id` o `email` de la usuaria a consultar
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a consultar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.get('/users/:uid', requireAdmin && requireAuth, (req, resp) => {
    const { uid } = req.params;
    if (!uid) {
      return next(401);
    }

    const isEmail = uid.includes('@');
    if (isEmail) {
      if (JSON.parse(req.user.roles)) {
        if (!(JSON.parse(req.user.roles).admin
          || ((req.user.email).toString() === uid))) {
          return next(403);
        }
      } else {
        return next(403);
      }
      getDataByEmail('users', uid)
        .then((result) => {
          resp.status(200).send({
            _id: result[0].id,
            email: result[0].email,
            roles: result[0].roles,
          });
        })
        .catch(() => resp.status(404).send('users does not exist'));
    } else {
      if (!(JSON.parse(req.user.roles).admin
        || ((req.user.id).toString() === uid))) {
        return next(403);
      }
      getDataById('users', uid)
        .then((result) => {
          resp.status(200).send({
            _id: result[0].id,
            email: result[0].email,
            roles: result[0].roles,
          });
        })
        .catch(() => resp.status(404).send('users does not exist'));
    }
  });

  /**
   * @name POST /users
   * @description Crea una usuaria
   * @path {POST} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si ya existe usuaria con ese `email`
   */
  app.post('/users', requireAdmin, (req, resp) => {
    const { email, password, roles } = req.body;
    if (!(email && password)) {
      return resp.status(400).send('invalid email or password');
    }
    if (!(validatePassword(password) && validateEmail(email))) {
      return next(400);
    }

    const rolesN = roles || { admin: false };
    const newUser = {
      email,
      password: bcrypt.hashSync(password, 10),
      roles: JSON.stringify(rolesN),
    };
    getDataByEmail('users', email)
      .then(() => resp.status(403).send('users exist'))
      .catch(() => {
        createData('users', newUser)
          .then((result) => {
            resp.status(200).send(
              {
                _id: result.insertId.toString(),
                email,
                roles: rolesN,
              },
            );
          });
      });
  });

  /**
   * @name PUT /users
   * @description Modifica una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {PUT} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a modificar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {403} una usuaria no admin intenta de modificar sus `roles`
   * @code {404} si la usuaria solicitada no existe
   */
  app.put('/users/:uid', requireAuth && requireAdmin, (req, resp) => {
    const { uid } = req.params;
    const { email, password, roles } = req.body;
    const isEmail = uid.includes('@');
    console.log("put", isEmail, email, password, roles, uid, req.user);
    //if (!email && !password && !roles) {
    //  return next(400);
   // }
    if (password) {
      if (!validatePassword(password)) {
        return next(400);
      }
    }
    if (email) {
      if (!validateEmail(email)) {
        return next(400);
      }
    }
    const rolesN = roles || { admin: false };
    const newUser = {
      email,
      password: bcrypt.hashSync(password, 10),
      roles: rolesN,
    };
    if (!(validateEmail(email))) {
      delete newUser.email;
    }
    if (!(validatePassword(password))) {
      delete newUser.password;
    }
    if (!(roles)) {
      delete newUser.roles;
    }
    console.log("newUser",newUser);
    
    if (isEmail) {
      console.log("email",req.user.email);
      if (!(JSON.parse(req.user.roles).admin
        || ((req.user.email).toString() === uid))) {
        return next(403);
      }

      getDataByEmail('users', uid)
        .then((result) => {
          updateDataById('users', result[0].id, newUser)
            .then(() => resp.status(200).send(
              {
                _id: result[0].id,
                email: result[0].email,
                roles: result[0].roles,
              },
            ));
        })
        .catch(() => resp.status(404).send('users does not exist'));
    } else {
      console.log("email",req.user.id);
      // eslint-disable-next-line no-lonely-if
      if (!(JSON.parse(req.user.roles).admin
        || ((req.user.id).toString() === uid))) {
        return next(403);
      }
      getDataById('users', uid)
        .then((result) => {
          updateDataById('users', uid, newUser)
            .then(() => resp.status(200).send(
              {
                _id: result[0].id,
                email: result[0].email,
                roles: result[0].roles,
              },
            ));
        })
        .catch(() => resp.status(404).send('users does not exist'));
    }
  });

  /**
   * @name DELETE /users
   * @description Elimina una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {DELETE} /users
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a eliminar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.delete('/users/:uid', requireAuth && requireAdmin, (req, resp) => {
    const { uid } = req.params;
    getDataById('users', uid)
      .then((result) => {
        deleteData('users', uid)
          .then(() => resp.status(200).send(result));
      })
      .catch(() => resp.status(404).send('users does not exist'));
  });

  initAdminUser(app, next);
};
