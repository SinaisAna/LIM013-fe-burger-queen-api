/* eslint-disable linebreak-style */
/* eslint-disable radix */
/* eslint-disable linebreak-style */
const {
  requireAuth,
} = require('../middleware/auth');

const {
  getDataByKey,
  getAllData,
  getDataById,
  createData,
  updateDataById,
  deleteData,
  getOrderById,
} = require('../controller/sql_query');

/** @module orders */
module.exports = (app, nextMain) => {
  /**
   * @name GET /orders
   * @description Lista órdenes
   * @path {GET} /orders
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación
   * @response {Array} orders
   * @response {String} orders[]._id Id
   * @response {String} orders[].userId Id usuaria que creó la orden
   * @response {String} orders[].client Clienta para quien se creó la orden
   * @response {Array} orders[].products Productos
   * @response {Object} orders[].products[] Producto
   * @response {Number} orders[].products[].qty Cantidad
   * @response {Object} orders[].products[].product Producto
   * @response {String} orders[].status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} orders[].dateEntry Fecha de creación
   * @response {Date} [orders[].dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   */
  app.get('/orders', requireAuth, async (req, resp) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const host = req.get('host');
    // const finalResult = {};
    const ordersT = await getAllData('orders', page, limit, host);
    const orders = ordersT.result;
    const qtyOrders = orders.length;
    if (qtyOrders > 0) {
      let i = 0;
      const productArray = [];
      orders.forEach(async (element) => {
        const products = await getOrderById(element.id);
        productArray[i] = {
          _id: element.id,
          userId: element.id_user,
          client: element.client,
          products,
          status: element.status,
          dateEntry: element.dateEntry,
        };
        // eslint-disable-next-line no-plusplus
        i++;
        if (qtyOrders === i) {
          // finalResult.orders = productArray;
          // finalResult.first = ordersT.first;
          // finalResult.next = ordersT.next;
          // finalResult.last = ordersT.last;
          // finalResult.prev = ordersT.prev;
          ordersT.result = productArray;
          resp.status(200).send(ordersT);
        }
      });
    } else {
      resp.status(400).send('not data');
    }
  });

  /**
   * @name GET /orders/:orderId
   * @description Obtiene los datos de una orden especifico
   * @path {GET} /orders/:orderId
   * @params {String} :orderId `id` de la orden a consultar
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orden con `orderId` indicado no existe
   */
  app.get('/orders/:orderId', requireAuth, (req, resp) => {
    const { orderId } = req.params;
    getDataById('orders', orderId)
      .then((result) => {
        let productArray = {};
        getOrderById(result[0].id)
          .then((products) => {
            productArray = {
              _id: result[0].id,
              userId: result[0].id_user,
              client: result[0].client,
              products,
              status: result[0].status,
              dateEntry: result[0].dateEntry,
            };
            resp.status(200).send(productArray);
          });
      })
      .catch(() => resp.status(404).send('no products'));
  });

  /**
   * @name POST /orders
   * @description Crea una nueva orden
   * @path {POST} /orders
   * @auth Requiere `token` de autenticación
   * @body {String} userId Id usuaria que creó la orden
   * @body {String} client Clienta para quien se creó la orden
   * @body {Array} products Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} no se indica `userId` o se intenta crear una orden sin productos
   * @code {401} si no hay cabecera de autenticación
   */
  app.post('/orders', requireAuth, (req, resp) => {
    const {
      userId, client, products,
    } = req.body;

    const dateEntry = new Date();

    const newOrder = {
      id_user: userId,
      client,
      status: 'pending',
      dateEntry,
    };
    createData('orders', newOrder)
      .then((result) => {
        products.forEach((product) => {
          const newOrderdetail = {
            id_order: result.insertId,
            id_product: product.productId,
            quantity: product.qty,
          };
          createData('order_details', newOrderdetail);
        });
        getOrderById(result.insertId)
          .then((data) => {
            newOrder._id = result.insertId;
            newOrder.products = data;
            resp.status(200).send(newOrder);
          });
      });
  });

  /**
   * @name PUT /orders
   * @description Modifica una orden
   * @path {PUT} /products
   * @params {String} :orderId `id` de la orden
   * @auth Requiere `token` de autenticación
   * @body {String} [userId] Id usuaria que creó la orden
   * @body {String} [client] Clienta para quien se creó la orden
   * @body {Array} [products] Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @body {String} [status] Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican ninguna propiedad a modificar o la propiedad `status` no es valida
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orderId con `orderId` indicado no existe
   */
  app.put('/orders/:orderId', requireAuth, (req, resp) => {
    const { orderId } = req.params;
    const {
      userId, client, products, status,
    } = req.body;

    const newOrder = {
      id_user: userId,
      client,
      status,
    };
    getDataById('orders', orderId)
      .then(async () => {
        updateDataById('orders', orderId, newOrder);
        const dataProducts = await getDataByKey('order_details', 'id_order', orderId);
        dataProducts.forEach((dProduct) => {
          deleteData('order_details', dProduct.id);
        });

        products.forEach((product) => {
          const newOrderdetail = {
            id_order: orderId,
            id_product: product.productId,
            quantity: product.qty,
          };
          createData('order_details', newOrderdetail);
        });
        const resuProduct = await getOrderById(orderId);
        newOrder._id = orderId;
        newOrder.products = resuProduct;
        resp.status(200).send(newOrder);
      })
      .catch(() => resp.status(404).send('orders does not exist'));
  });

  /**
   * @name DELETE /orders
   * @description Elimina una orden
   * @path {DELETE} /orders
   * @params {String} :orderId `id` del producto
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si el producto con `orderId` indicado no existe
   */
  app.delete('/orders/:orderId', requireAuth, (req, resp) => {
    const { orderId } = req.params;
    getDataById('orders', orderId)
      .then(async (result) => {
        let productArray = {};
        getOrderById(result[0].id)
          .then((products) => {
            productArray = {
              _id: result[0].id,
              userId: result[0].id_user,
              client: result[0].client,
              products,
              status: result[0].status,
              dateEntry: result[0].dateEntry,
            };
            resp.status(200).send(productArray);
          });
        const dataProducts = await getDataByKey('order_details', 'id_order', orderId);
        dataProducts.forEach((dProduct) => {
          deleteData('order_details', dProduct.id);
        });
        deleteData('orders', orderId);
      })
      .catch(() => resp.status(404).send('orders does not exist'));
  });

  nextMain();
};
