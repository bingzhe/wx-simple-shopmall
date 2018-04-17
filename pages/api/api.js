const EncSubmit = require('../../utils/http.js')

// example
export const shopinfoGet = function (data) {
    return new Promise(resolve => {
        EncSubmit('shopinfo_get.php', data, resp => {
            resolve(resp);
        });
    });
};

module.exports = {
    shopinfoGet: shopinfoGet
}
