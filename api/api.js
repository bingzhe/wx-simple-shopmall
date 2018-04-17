import EncSubmit from '../utils/http'
console.log(EncSubmit)
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
