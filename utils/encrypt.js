const Crypt = {
    /*
     * 功能：打乱及还原字符串
     * 编写：Rocky 2010-05-14 10:42:45
     */
    Swap: {
        // 把str顺序打乱
        doit: function (seed, str) {
            var result = str.split('');
            var len = result.length;
            seed += len; // 再加串的长度做相关性

            for (var i = 0; i < len; i++) {
                var range = len - i - 1;    //// alert(range);
                var m = this.Rand(seed, i, 0, range);

                var tmp = result[range];
                result[range] = result[m];
                result[m] = tmp;
            }
            //result[ len ] = '\0';
            return result.join('');
        },

        // 对应于Swap0()，即还原str串；
        undo: function (seed, str) {
            var result = str.split('');
            var len = result.length;
            seed += len; // 再加串的长度做相关性

            for (var i = len - 1; i >= 0; i--) {
                var range = len - i - 1;
                var m = this.Rand(seed, i, 0, range);

                var tmp = result[m];
                result[m] = result[range];
                result[range] = tmp;
            }
            return result.join('');
        },

        // 取随机数（伪）
        Rand: function (seed, n, min, max) {
            var m = (~(seed * 262147 * n)) & 0x0FFFFFFF;
            var range = max + 1 - min;
            if (range <= 0) {
                range = 1;
            }
            var ret = (min + m) % range;
            //alert(seed + ',' + n + ',' + min + ',' + max + ',' + m + ',' + range + ',' + ret);
            return ret;
        }
    },

    // 计算种子（简单相加
    CalSeed: function (str) {
        var seed = 0;
        for (var i = 0; i < str.length; i++) {
            seed = (seed + str.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return seed & 0x7FFFFFFF;
    },

    encode: function (password, data) {
        var pasd_b64 = encodeURIComponent(password);
        var plaintext_b64 = encodeURIComponent(data);
        var ciphertext = '';
        var pasd_i = 0;

        for (var data_i = 0; data_i < plaintext_b64.length; data_i++) {
            //ciphertext += String.fromCharCode(plaintext_b64.charCodeAt(data_i) ^ pasd_b64.charCodeAt(pasd_i));
            var num = (plaintext_b64.charCodeAt(data_i) ^ pasd_b64.charCodeAt(pasd_i)).toString(16);
            if (num.length < 2) {
                num = '0' + num;
            }
            ciphertext += num;
            pasd_i++;
            if (pasd_i == pasd_b64.length) {
                pasd_i = 0;
            }
        }

        var seed = this.CalSeed(pasd_b64);
        return this.Swap.doit(seed, ciphertext);
    },

    decode: function (password, data) {
        var pasd_b64 = encodeURIComponent(password);
        var seed = this.CalSeed(pasd_b64);
        var ciphertext = this.Swap.undo(seed, data);
        var plaintext_b64 = '';
        var pasd_i = 0;

        for (var i = 0; i < ciphertext.length; i += 2) {
            //plaintext_b64 += String.fromCharCode(ciphertext.charCodeAt(i) ^ pasd_b64.charCodeAt(pasd_i));
            var hex = parseInt('0x' + ciphertext.charAt(i) + ciphertext.charAt(i + 1));
            var ascii = hex ^ pasd_b64.charCodeAt(pasd_i);
            plaintext_b64 += String.fromCharCode(ascii);
            pasd_i++;
            if (pasd_i == pasd_b64.length) {
                pasd_i = 0;
            }
        }

        return decodeURIComponent(plaintext_b64);
    }
};

// 暴露encrypt，decrypt函数
export const encrypt = function (password, data) {
    try {
        return Crypt.encode(password, data);
    }
    catch (e) {
        console.warn(e.stack);
    }
    return "";
};

export const decrypt = function (password, data) {
    try {
        return Crypt.decode(password, data);
    }
    catch (e) {
        console.warn(e.stack);
    }
    return "";
};

/********************************** example **********************************/
/*
function do_encrypt()
{
    d3 = encrypt(document.getElementById('d1').value, document.getElementById('d2').value);
    document.getElementById('d3').value = d3;
}

function do_decrypt()
{
    d2 = decrypt(document.getElementById('d1').value, document.getElementById('d3').value);
    document.getElementById('d2').value = d2;
}
*/
