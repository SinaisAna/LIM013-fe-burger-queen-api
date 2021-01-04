/* eslint-disable linebreak-style */
/* eslint-disable no-param-reassign */
/* eslint-disable radix */
/* eslint-disable linebreak-style */
const mysqlConnection = require('../database');

module.exports = {
  getUsers: (req, resp) => {
    
    const sql = 'SELECT * FROM users';
    mysqlConnection.query(sql, (error, result) => {
      if (error) throw error;
      const totalData = result.length;
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      const host = req.get('host');
      if (!page && !limit) {
        return resp.status(200).send(result);
      }
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      if (totalData > 0) {
        let finalpages = Math.trunc(totalData / limit);
        if (totalData % limit > 0) {
          finalpages += 1;
        }
        result = result.slice(startIndex, endIndex);
        const finalResult = {};

        finalResult.result = result;
        if (endIndex < totalData) {
          finalResult.next = `<http://${host}/users?page=${page + 1}&limit=${limit}>`;
        }
        if (startIndex > 0) {
          finalResult.prev = `<http://${host}/users?page=${page - 1}&limit=${limit}>`;
        }
        finalResult.first = `<http://${host}/users?page=1&limit=${limit}>`;
        finalResult.last = `<http://${host}/users?page=${finalpages}&limit=${limit}>`;
        return resp.status(200).send(finalResult);
      }
      return resp.status(404).send('No data');
    });
  },
};
