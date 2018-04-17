import { encrypt, decrypt } from './encrypt'

const Util = require('./util.js')
const md5 = require('./md5.min.js')
const RSA = require('./wxapp_rsa.js')
// 域名
const BASE_URL = 'http://customer.jzzwlcm.com/php/'

/**
 * 
 * 终端标识token
 */
const createToken = function () {
  let token = wx.getStorageSync('token')
  if (!token) {
    token = "T1" + Util.GetRandString(14)
    wx.setStorageSync('token', token)
  }
  return token;
}

/**
 * 前后台数据加密key
 */
const createKey = function () {

  let token = createToken(),
    key

  // 取公钥
  function get_publickey() {
    return new Promise((resolve, reject) => {
      let pubkey = ""

      wx.request({
        url: `${BASE_URL}rsa_info.php?${Util.GetRandString(3)}`,
        dataType: 'json',
        data: {
          "publickey": 1
        },
        success: resp => {
          if (resp.statusCode === 200 && resp.data.ret === 0) {
            pubkey = resp.data.data.publickey
            resolve(pubkey)
          } else {
            reject(resp)
          }
        },
        fail: resp => {
          reject(resp)
        }
      })
    })
  }

  // 提交key到服务器
  function submit_key(pubkey) {
    return new Promise((resolve, reject) => {
      key = Util.GetRandString(16) // 随机key
      console.log("key:" + key)

      //加密
      // let rsa = new JSEncrypt();
      // rsa.setPublicKey(pubkey);
      // let key_enc = rsa.encrypt(key);

      let encrypt_rsa = new RSA.RSAKey()
      encrypt_rsa = RSA.KEYUTIL.getKey(pubkey)
      let key_enc = encrypt_rsa.encrypt(key)

      wx.request({
        url: `${BASE_URL}rsa_info.php?${Util.GetRandString(3)}`,
        dataType: "json",
        data: {
          "save_key": 1,
          "is_plain": 1, // 是明文（配合后台DecSubmitData()用）
          "key_enc": key_enc,
          "token": token
        },
        success: resp => {
          if (resp.statusCode === 200 && resp.data.ret === 0) {
            wx.setStorageSync('key', key)
            resolve(key)
          } else {
            reject(resp)
          }
        },
        fail: resp => {
          reject(resp)
        }
      })
    })
  }

  return get_publickey()
    .then(submit_key)
    .catch(resp => {
      console.warn(resp)
    })
}

// 只序列化对象
const r20 = /%20/g
const paramObj = function (obj) {
  if (!Util.isPlainObject(obj)) {
    return
  }

  let s = [],
    add = function (key, value) {
      value = value == null ? "" : value;
      s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
    };


  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const element = obj[key]
      add(key, element)
    }
  }

  return s.join("&").replace(r20, "+");
}
/*
* other : {
*      //dataType: xxx,
*      //mimeType: xxx,
*      is_get_param: 1,            // 只返回要提交的参数（不执行提交动作）
*      encmode: xxx                // 数据加密方式[""|encrypt1]
*      ...
* }
*/
const EncSubmit = function (url, data, resp_func/*, other --> {dataType:xxx, mimeType:xxx, ...}*/) {
  if (!data instanceof Object) {
    // param err
    return;
  }

  let token = createToken()
  let key = wx.getStorageSync('key')

  if (!key) {
    createKey()
    key = wx.getStorageSync('key')
  }

  let data_type = null,
    // mime_type = null,
    is_get_param = null,
    encmode = ""

  if (arguments.length > 3 && Util.isPlainObject(arguments[3])) // 可变参数时
  {
    data_type = "json"  //arguments[3].dataType;
    // mime_type = arguments[3].mimeType
    is_get_param = arguments[3].is_get_param
    encmode = arguments[3].encmode;
  }

  for (let item in data) {
    if (typeof (data[item]) !== "string" && typeof (data[item]) !== "number" && typeof (data[item]) !== "boolean") {
      data[item] = JSON.stringify(data[item]);
    }
  }

  let datastr = paramObj(data)

  if ("encrypt1" == encmode) {
    datastr = encrypt(key, datastr)
  }

  let param = {
    token: token,
    userid: wx.getStorageSync('userid'),
    encmode: encmode,
    data: datastr,
    sign: md5(datastr + key)
  };

  // 只取参数
  if (is_get_param) {
    return param
  }


  wx.request({
    url: `${BASE_URL}${url}?${(new Date()).getTime()}`,
    method: "POST",
    dataType: data_type || "json",
    data: param,
    success: function (resp) {
      resp = resp.data || {}

      //未登录调回首页
      // if (resp.ret === errcode.USER_NOLOGIN) {
      //     router.push("/");
      // }

      //通讯key不存在，签名错误
      // if (resp.ret === errcode.DATA_KEY_NOT_EXIST || resp.ret === errcode.SVC_ERR_DATA_SIGN) {
      //     window.Store.DelGlobalData('key');
      // }

      if (typeof (resp_func) === 'function') {
        if (0 === resp.ret && resp.crypt === "1" && resp.data !== "") {
          resp.data = JSON.parse(decrypt(key, resp.data))
          delete resp.crypt
        }
        return resp_func(resp)
      }

    },

    error: function (resp) {
      if (typeof (resp_func) === 'function') {
        var ret = {
          ret: -1,
          data: "resp.responseText: " + resp.responseText
        };
        return resp_func(ret);
      }
    }
  }) // end of wx.request({...
}

module.exports = EncSubmit
