/* eslint-disable linebreak-style */
const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};
const validatePassword = (password) => {
  const re = /[A-Za-z0-9]{6,30}$/;
  return re.test((password));
};
module.exports = {
  validateEmail,
  validatePassword,
};
