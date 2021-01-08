/* eslint-disable linebreak-style */
/* eslint-disable no-console */
const mysql = require('mysql');

const mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'burger',
});

module.exports = mysqlConnection;
