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
  app.get('/orders', requireAuth, async (req, resp, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const host = req.get('host');
    console.log("entro aqui");
    // const finalResult = {};
    const ordersT = await getAllData('orders', page, limit, host);
    console.log("entro aqui2", ordersT);
    const orders = ordersT;
    const qtyOrders = ordersT.length;
    if (qtyOrders > 0) {
      let i = 0;
      const productArray = [];
      orders.forEach(async (element) => {
        const products = await getOrderById(element.id);
        const newproducts = products.map((re) => ({
          product: { price: re.price, name: re.name, qty: re.qty },
        }));

        productArray[i] = {
          _id: element.id,
          userId: element.id_user,
          client: element.client,
          products: newproducts,
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
          return resp.status(200).send(ordersT);
        }
      });
    } else {
      return next(400);
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
            const newproducts = products.map((re) => ({
              product: { price: re.price, name: re.name, qty: re.qty },
            }));
            productArray = {
              _id: result[0].id,
              userId: result[0].id_user,
              client: result[0].client,
              products: newproducts,
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
  app.post('/orders', requireAuth, (req, resp, next) => {
    const {
      userId, client, products,
    } = req.body;

    if (!userId && !products) {
      return next(400);
    }
    if (products) {
      if (products.length === 0) {
        return next(400);
      }
    }
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
            id_order: result.insertId.toString(),
            id_product: product.productId.toString(),
            quantity: product.qty,
          };
          createData('order_details', newOrderdetail);
        });
        getOrderById(result.insertId)
          .then((data) => {
            const newproducts = data.map((re) => ({
              product: { qty: re.qty, name: re.name, price: re.price },
            }));
            newOrder._id = result.insertId.toString();
            newOrder.products = newproducts;
            return resp.status(200).send(newOrder);
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
  app.put('/orders/:orderId', requireAuth, (req, resp, next) => {
    const { orderId } = req.params;
    const {
      userId, client, products, status,
    } = req.body;
    if (status !== 'pending' && status !== 'canceled' && status !== 'delivering' && status !== 'delivered' && status !== 'preparing') {
      return next(400);
    }
    if (!(userId && client && products && status)) {
      // return next(404);
    }
    const newOrder = {
      id_user: userId,
      client,
      status,
    };
    if (!(userId)) {
      delete newOrder.userId;
    }
    if (!(client)) {
      delete newOrder.client;
    }
    if (!(status)) {
      delete newOrder.status;
    }
    getDataById('orders', orderId)
      .then(async () => {
        updateDataById('orders', orderId, newOrder);
        const dataProducts = await getDataByKey('order_details', 'id_order', orderId);

        if (dataProducts.length > 0) {
          dataProducts.forEach((dProduct) => {
            deleteData('order_details', dProduct.id);
          });
        }

        if (products) {
          products.forEach((product) => {
            const newOrderdetail = {
              id_order: orderId,
              id_product: product.productId,
              quantity: product.qty,
            };
            createData('order_details', newOrderdetail);
          });
        }

        const resuProduct = await getOrderById(orderId);
        if (resuProduct.length > 0) {
          const newproducts = resuProduct.map((re) => ({
            product: { price: re.price, name: re.name, qty: re.qty },
          }));
          newOrder.products = newproducts;
        }
        newOrder._id = orderId;
        return resp.status(200).send(newOrder);
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
            const newproducts = products.map((re) => ({
              product: { price: re.price, name: re.name, qty: re.qty },
            }));
            productArray = {
              _id: result[0].id,
              userId: result[0].id_user,
              client: result[0].client,
              products: newproducts,
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
