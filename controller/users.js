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
      const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
      const limit = parseInt(req.query.limit);
      const host = req.get('host');
      result = result.map((re) => ({
        _id: re.id,
        email: re.email,
        roles: re.roles,
      }));
      if (!limit) {
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
        let link = `<https://${host}/users?page=1&limit=${limit}>; rel="first",<https://${host}/users?page=${finalpages}&limit=${limit}>; rel="last"`;
        if (endIndex < totalData) {
          const nextUrl = `,<https://${host}/users?page=${page + 1}&limit=${limit}>; rel="next"`;
          finalResult.next = nextUrl;
          link = link.concat(nextUrl);
        }
        if (startIndex > 0) {
          const prevUrl = `,<https://${host}/users?page=${page - 1}&limit=${limit}>; rel="prev"`;
          finalResult.prev = prevUrl;
          link = link.concat(prevUrl);
        }
        finalResult.first = `<https://${host}/users?page=1&limit=${limit}>`;
        finalResult.last = `<https://${host}/users?page=${finalpages}&limit=${limit}>`;
        resp.header('link', link);
        return resp.status(200).send(result);
      }
      return resp.status(404).send('No data');
    });
  },
};
