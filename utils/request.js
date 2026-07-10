/**
 * 网络请求封装 - Promise 化 wx.request
 * 支持跨域请求，统一错误处理，自动携带鉴权 token
 */

/**
 * 通用请求方法
 * @param {string} url    接口路径（不含 baseUrl）
 * @param {string} method 请求方法 GET/POST/PUT/DELETE
 * @param {object} data   请求数据
 * @returns {Promise}
 */
function request(url, method = 'GET', options = {}) {
  var Base64 = require('./base64');
  var app = getApp();
  console.log(app);
  var baseUrl = app.globalData.baseUrl
  // 自动注入 token
  var token = app.globalData.token || ''
  var header = {
    'content-type': 'application/json'
  }
  if (token) {
    header['Cookie'] = 'x-custom-token=' + token
  }
  url = url || "";
  if (url.indexOf("?") > -1) {
      url += "&r=" + Math.random();
  } else {
      url += "?r=" + Math.random();
  }
  if (JSON.stringify(options.data) != "{}") {
    options.data = Base64.encode(encodeURIComponent(JSON.stringify(options.data)));
    options.data = { EncryptedData: options.data };
  }
  console.log(baseUrl + url);
  
  wx.request({
    url: baseUrl + url,
    method: method,
    data: options.data,
    header: header,
    success(res) {
      if (res.statusCode != 200) {
        wx.showToast({
          title: `网络错误(${res.statusCode})`,
          icon: 'none'
        });
        return;
      }              
      try {
        var data1 = res.data;
        if (data1.hasOwnProperty("EncryptedData")) {
            data1 = decodeURIComponent(Base64.decode(data1.EncryptedData)).replaceAll("+", " ");
            data1 = JSON.parse(data1);
        }
        res.data = data1;
      } catch (e) { };     
      console.log(res.data);
      options.success(res.data);
    },
    fail(err) {
      if(options.error) {
        options.error(err.errMsg);
        return;
      }
      wx.showToast({
        title: '网络连接失败',
        icon: 'none'
      })
    }
  })
}

module.exports = {
  get: (url, options) => request(url, 'GET', options),
  post: (url, options) => request(url, 'POST', options),
}
