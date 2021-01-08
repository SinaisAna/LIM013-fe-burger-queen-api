/* eslint-disable linebreak-style */
/* eslint-disable radix */
/* eslint-disable linebreak-style */
const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const {
  getAllData,
  getDataById,
  createData,
  updateDataById,
  deleteData,
} = require('../controller/sql_query');

/** @module products */
module.exports = (app, nextMain) => {
  /**
   * @name GET /products
   * @description Lista productos
   * @path {GET} /products
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación
   * @response {Array} products
   * @response {String} products[]._id Id
   * @response {String} products[].name Nombre
   * @response {Number} products[].price Precio
   * @response {URL} products[].image URL a la imagen
   * @response {String} products[].type Tipo/Categoría
   * @response {Date} products[].dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   */
  app.get('/products', requireAuth, (req, resp) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const host = req.get('host');

    getAllData('products', page, limit, host)
      .then((result) => {
        const newproducts = result.map((re) => ({
          _id: re.id.toString(),
          name: re.name,
          price: re.price,
          image: re.image,
          type: re.type,
          dateEntry: re.dateEntry,
        }));
        return resp.status(200).send(newproducts);
      })
      .catch(() => resp.status(404).send('no products'));
  });

  /**
   * @name GET /products/:productId
   * @description Obtiene los datos de un producto especifico
   * @path {GET} /products/:productId
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.get('/products/:productId', requireAuth, (req, resp) => {
    const { productId } = req.params;
    if (!productId) {
      return resp.status(400).send('No data');
    }
    getDataById('products', productId)
      .then((result) => {
        resp.status(200).send({
          _id: result[0].id.toString(),
          name: result[0].name,
          price: result[0].price,
          image: result[0].image,
          type: result[0].type,
          dateEntry: result[0].dateEntry,
        });
      })
      .catch(() => resp.status(404).send('product does not exist'));
  });

  /**
   * @name POST /products
   * @description Crea un nuevo producto
   * @path {POST} /products
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @body {String} name Nombre
   * @body {Number} price Precio
   * @body {String} [imagen]  URL a la imagen
   * @body {String} [type] Tipo/Categoría
   * @response {Object} product
   * @response {String} products._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican `name` o `price`
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.post('/products', requireAdmin, (req, resp) => {
    const {
      name, price, image, type,
    } = req.body;
    if (!(name && price)) {
      return resp.status(400).send('missing required data');
    }
    const dateEntry = new Date();
    const newProduct = {
      name,
      price,
      image,
      type,
      dateEntry,
    };

    createData('products', newProduct)
      .then((result) => resp.status(200).send(
        {
          _id: result.insertId.toString(),
          name,
          price,
          image,
          type,
          dateEntry,
        },
      ));
  });

  /**
   * @name PUT /products
   * @description Modifica un producto
   * @path {PUT} /products
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación y que el usuario sea **admin**
   * @body {String} [name] Nombre
   * @body {Number} [price] Precio
   * @body {String} [imagen]  URL a la imagen
   * @body {String} [type] Tipo/Categoría
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican ninguna propiedad a modificar
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.put('/products/:productId', requireAdmin, (req, resp, next) => {
    const { productId } = req.params;
    const {
      name, price, image, type,
    } = req.body;
    if (typeof price !== 'number') {
      return next(400);
    }
    const newProduct = {
      name,
      price,
      image,
      type,
    };
    getDataById('products', productId)
      .then(() => {
        updateDataById('products', productId, newProduct)
          .then(() => resp.status(200).send(
            {
              id: productId,
              name,
              price,
              image,
              type,
            },
          ));
      })
      .catch(() => resp.status(404).send('products does not exist'));
  });

  /**
   * @name DELETE /products
   * @description Elimina un producto
   * @path {DELETE} /products
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación y que el usuario sea **admin**
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.delete('/products/:productId', requireAdmin, (req, resp) => {
    const { productId } = req.params;
    getDataById('products', productId)
      .then((result) => {
        deleteData('products', productId)
          .then(() => resp.status(200).send(result));
      })
      .catch(() => resp.status(404).send('product does not exist'));
  });

  nextMain();
};
