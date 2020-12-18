/* eslint-disable linebreak-style */
/* eslint-disable no-param-reassign */
/* eslint-disable radix */
/* eslint-disable linebreak-style */
const mysqlConnection = require('../database');

module.exports = {
  getUsers: (req, resp) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const sql = 'SELECT * FROM users';
    mysqlConnection.query(sql, (error, result) => {
      if (error) throw error;
      if (result.length > 0) {
        result = result.slice(startIndex, endIndex);
        return resp.status(200).send(result);
      }
      return resp.status(404).send('No data');
    });
  },
};
