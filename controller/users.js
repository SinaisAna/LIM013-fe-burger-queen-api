/* eslint-disable linebreak-style */
const mysqlConnection = require('../database');

module.exports = {
  getUsers: (req, resp, next) => {
    const sql = 'SELECT * FROM users';
    mysqlConnection.query(sql, (error, result) => {
      if (error) throw error;
      if (result.length > 0) {
        return resp.status(200).send(result);
      }
      return resp.status(404).send('No data');
    });
  },
};
