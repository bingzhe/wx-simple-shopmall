const _toString = Object.prototype.toString
const hasOwnProperty = Object.prototype.hasOwnProperty

const Util = {
  isTrue: function (v) {
    return v === true
  },
  isFalse: function (v) {
    return v === false
  },
  //未定义
  isUndef: function (v) {
    return v === undefined || v === null
  },
  //已定义
  isDef: function (v) {
    return v !== undefined && v !== null
  },
  //isPrimitive
  isPrimitive: function (v) {
    typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'symbol' ||
      typeof v === 'boolean'
  },
  isObject: function (obj) {
    return obj !== null && typeof obj === 'object'
  },
  // 纯javascript对象
  isPlainObject: function (obj) {
    return _toString.call(obj) === '[object Object]'
  },
  //是否是RegExp对象
  isRegExp: function (obj) {
    return _toString.call(v) === '[object RegExp]'
  },
  // Check if val is a valid array index
  isValidArrayIndex: function (val) {
    var n = parseFloat(String(val));
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  },
  /**
   * 转字符串
   * null 和 undefined 转成空字符转，对象转成格式化的JSON字符串，其他调用String()
   */
  toString: function (val) {
    return val == null
      ? ''
      : typeof val === 'object'
        ? JSON.stringify(val, null, 2)
        : String(val)
  },
  /**
   * 字符串转化为数字
   * 转化失败返回原字符串
   */
  toNumber: function (val) {
    var n = parseFloat(val);
    return isNaN(n) ? val : n
  },
  //数组中删除一项
  remove: function (arr, item) {
    if (arr.length) {
      var index = arr.indexOf(item);
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
  },
  //对象是否有某个属性
  hasOwn: function (obj, key) {
    return hasOwnProperty.call(obj, key)
  },
  //将类数组的对象转换成数组
  toArray: function (list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
    while (i--) {
      ret[i] = list[i + start];
    }
    return ret
  },
  //混合属性到目标属性
  extend: function (to, _from) {
    for (var key in _from) {
      to[key] = _from[key];
    }
    return to
  },
  // 合并Array数组中的每一个对象到一个新的Object中
  toObject: function (arr) {
    const res = {}
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]) {
        Util.extend(res, arr[i])
      }
    }
    return res
  },
  //检测两个变量是否相等
  looseEqual: function (a, b) {
    if (a === b) { return true }
    var isObjectA = Util.isObject(a);
    var isObjectB = Util.isObject(b);
    if (isObjectA && isObjectB) {
      try {
        var isArrayA = Array.isArray(a);
        var isArrayB = Array.isArray(b);
        if (isArrayA && isArrayB) {
          return a.length === b.length && a.every(function (e, i) {
            return looseEqual(e, b[i])
          })
        } else if (!isArrayA && !isArrayB) {
          var keysA = Object.keys(a);
          var keysB = Object.keys(b);
          return keysA.length === keysB.length && keysA.every(function (key) {
            return looseEqual(a[key], b[key])
          })
        } else {
          /* istanbul ignore next */
          return false
        }
      } catch (e) {
        /* istanbul ignore next */
        return false
      }
    } else if (!isObjectA && !isObjectB) {
      return String(a) === String(b)
    } else {
      return false
    }
  },
  // 检测arr数组中是否包含与val变量相等的项
  looseIndexOf: function (arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (Util.looseEqual(arr[i], val)) { return i }
    }
    return -1
  },
  // 取[begin, end]间的数据整数
  GetRandom: function (begin, end) {
    var num = Math.random() * 100000000;
    return Math.floor(num % (end - begin + 1) + begin);
  },
  // 取len长的随机字符串
  GetRandString: function (len, range) {
    range = range || "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var s = range.split('');
    var ret = '';
    for (var i = 0; i < len; i++) {
      ret += s[Util.GetRandom(0, s.length - 1)];
    }
    return ret;
  }
}

module.exports = Util