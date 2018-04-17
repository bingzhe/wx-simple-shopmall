import http from '../utils/http'

// example
export const shopinfoGet = function (data) {
  return new Promise(resolve => {
    http('shopinfo_get.php', data, resp => {
      resolve(resp);
    });
  });
};

module.exports = {
  shopinfoGet: shopinfoGet
}
