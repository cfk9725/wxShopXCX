var Base64 = require('./base64');

module.exports = {
    encode: function(obj) {
      if(typeof {} == "string") {
        return Base64.encode(encodeURIComponent(obj));
      }
      return Base64.encode(encodeURIComponent(JSON.stringify(obj)));
    },
    decode: function(str) {
      return decodeURIComponent(Base64.decode(str)).replaceAll("+", " ");
    },
    guid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
}