/* eslint-disable linebreak-style */
const mysqlConnection = require('../database');

module.exports = {
  getAllData: (table) => new Promise((resolve, reject) => {
    mysqlConnection.query(`SELECT * FROM ${table}`, (error, result) => {
      if (result.length) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  }),

  getDataById: (table, value) => new Promise((resolve, reject) => {
    mysqlConnection.query(`SELECT * FROM ${table} WHERE id =?`, value, (error, result) => {
      if (result.length > 0) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  }),

  getDataByKey: (table, key, value) => new Promise((resolve, reject) => {
    mysqlConnection.query(`SELECT * FROM ${table} WHERE ${key} =?`, value, (error, result) => {
      if (result.length > 0) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  }),

  getDataByEmail: (table, value) => new Promise((resolve, reject) => {
    mysqlConnection.query(`SELECT * FROM ${table} WHERE email =?`, value, (error, result) => {
      if (result.length > 0) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  }),

  createData: (table, values) => new Promise((resolve, reject) => {
    mysqlConnection.query(`INSERT INTO ${table} SET ?`, values, (error, result) => {
      resolve(result);
      reject(error);
    });
  }),

  updateDataById: (table, idValue, values) => new Promise((resolve, reject) => {
    mysqlConnection.query(`UPDATE ${table} SET ? WHERE id = ?`, [values, idValue], (error, result) => {
      resolve(result);
      reject(error);
    });
  }),

  deleteData: (table, idValue) => new Promise((resolve, reject) => {
    mysqlConnection.query(`DELETE FROM ${table} WHERE id = ?`, idValue, (error, result) => {
      resolve(result);
      reject(error);
    });
  }),

  getOrderById: (value) => new Promise((resolve, reject) => {
    mysqlConnection.query('select order_details.quantity,products.name from order_details inner join products on products.id=order_details.id_product where id_order=?', value, (error, result) => {
      if (result.length > 0) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  }),
};
