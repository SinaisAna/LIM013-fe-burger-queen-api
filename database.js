/* eslint-disable linebreak-style */
/* eslint-disable no-console */
const mysql = require('mysql');

const mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'burger',
});

mysqlConnection.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log('db is connet');
});

module.exports = mysqlConnection;
