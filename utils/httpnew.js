import { encrypt, decrypt } from './encrypt'
import { errcode } from "./cfg"

const Util = require('./util.js')
const md5 = require('./md5.min.js')
const RSA = require('./wxapp_rsa.js')

const BASE_URL = 'http://customer.jzzwlcm.com/php/'   //请求接口
const RSA_SVC_PATH = 'rsa_info.php'                   //指定取公钥地址
let data_key = ""
/**
 * terminal token
 */
const GetToken = function () {
    let token = wx.getStorageSync('token')
    if (!token) {
        token = "T1" + Util.GetRandString(14)
        wx.setStorageSync('token', token)
    }
    return token;
}

/**
 * Post request
 */
const Post = function (url, param, cb) {
    wx.request({
        url: url,
        method: "POST",
        data: param,
        header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        success: function (resp) {
            resp = resp.data || {}
            resp.data = resp.data || {}
            resp.ret = parseInt(resp.ret)
            if (isNaN(resp.ret)) {
                resp.ret = -1
            }
            cb(resp)
        },
        fail: function (resp) {
            let msg = `${resp.statusCode},${resp.errMsg}`
            cb({
                ret: -1,
                msg: msg
            });
        }
    })
}

/**
 * get publicKey
 */
const GetPublicKey = function (cb) {
    let full_url = `${BASE_URL}${RSA_SVC_PATH}`
    Post(full_url, { publickey: 1 }, cb)
}

/**
 * submit key
 */
const SubmitKey = function (publickey, cb) {
    let key = Util.GetRandString(16),            // 随机key
        token = GetToken()

    console.log("key:" + key)

    let encrypt_rsa = new RSA.RSAKey()
    encrypt_rsa = RSA.KEYUTIL.getKey(publickey)
    let key_enc = encrypt_rsa.encrypt(key)
    key_enc = RSA.hex2b64(key_enc)

    let p = {
        "save_key": 1,
        "is_plain": 1,
        "key_enc": key_enc,
        "token": token
    }
    let full_url = `${BASE_URL}${RSA_SVC_PATH}`

    Post(full_url, p, resp => {
        if (resp.ret === 0) {
            wx.setStorageSync('key', key)
            data_key = key
        }
        cb(resp)
    })
}



// 只序列化对象
const ParamObj = function (obj) {
    if (!Util.isPlainObject(obj)) {
        return
    }

    const r20 = /%20/g
    let s = [],
        add = function (key, value) {
            value = value == null ? "" : value;
            s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value)
        }

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const element = obj[key]
            add(key, element)
        }
    }

    return s.join("&").replace(r20, "+")
}
/*
* opt : {
*      //dataType: xxx,
*      //mimeType: xxx,
*      is_get_param: 1,            // 只返回要提交的参数（不执行提交动作）
*      encmode: xxx                // 数据加密方式[""|encrypt1]
*      ...
* }
*/
const EncSubmit = function (url, data, resp_callback, opt) {
    if (!data instanceof Object) {
        return;
    }

    opt = opt || {};
    opt.is_get_param = opt.is_get_param || false;
    opt.encmode = opt.encmode || "";
    resp_callback = resp_callback || function (v) { };

    let token = GetToken()
    let key = wx.getStorageSync('key')
    data_key = key

    const ToServer = function () {
        let key = data_key

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                if (typeof (data[key]) !== "string" && typeof (data[key]) !== "number" && typeof (data[key]) !== "boolean") {
                    data[key] = JSON.stringify(data[key]);
                }
            }
        }

        let datastr = ParamObj(data)

        if ("encrypt1" === opt.encmode) {
            datastr = encrypt(key, datastr)
        }

        let param = {
            token: token,
            encmode: opt.encmode,
            data: datastr,
            sign: md5(datastr + key)
        };

        let userid = wx.getStorageSync('userid')
        if (userid) {
            param.userid = userid
        }

        // 只取参数
        if (opt.is_get_param) {
            return param;
        }

        let full_url = `${BASE_URL}${url}?${(new Date()).getTime()}`
        Post(full_url, param, resp => {
            if (errcode.USER_NOLOGIN == resp.ret) {
                resp_callback(resp);
            }
            else if (errcode.DATA_KEY_NOT_EXIST == resp.ret) {
                resp_callback(resp);
                wx.setStorageSync('key', '')
            }
            if (0 === resp.ret && resp.crypt == "1" && resp.data !== "") {
                resp.data = JSON.parse(decrypt(THIS.data_key, resp.data))
                delete resp.crypt;
            }
            return resp_callback(resp)
        })
    }

    if (!key) {
        GetPublicKey(resp => {
            if (resp.ret !== 0) {
                resp_callback(resp);
                return;
            }
            SubmitKey(resp.data.publickey, v => {
                if (0 !== resp.ret) {
                    resp_callback(resp);
                    return;
                }
                ToServer();
            });
        })
    } else {
        ToServer();
    }
}

module.exports = EncSubmit
