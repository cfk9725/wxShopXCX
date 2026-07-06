/**
 * 网络请求封装 - Promise 化 wx.request
 * 支持跨域请求，统一错误处理，自动携带鉴权 token
 */

const app = getApp()

/**
 * 通用请求方法
 * @param {string} url    接口路径（不含 baseUrl）
 * @param {string} method 请求方法 GET/POST/PUT/DELETE
 * @param {object} data   请求数据
 * @returns {Promise}
 */
function request(url, method = 'GET', data = {}) {
  const baseUrl = app.globalData.baseUrl
  // 自动注入 token
  const token = app.globalData.token || ''
  const header = {
    'content-type': 'application/json'
  }
  if (token) {
    header['Authorization'] = 'Bearer ' + token
  }
  url = url || "";
  if (url.indexOf("?") > -1) {
      url += "&r=" + Math.random();
  } else {
      url += "?r=" + Math.random();
  }
  if (JSON.stringify(data) != "{}") {
    var data = btoa(encodeURIComponent(JSON.stringify(options.data)));
    options.data = { EncryptedData: data };
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method: method,
      data: data,
      header: header,
      success(res) {
        if (res.statusCode === 200 && res.data) {          
          try {
            var data1 = res.data;
            if (data1.hasOwnProperty("EncryptedData")) {
                data1 = decodeURIComponent(atob(data1.EncryptedData)).replaceAll("+", " ");
                data1 = JSON.parse(data1);
            }
            res.data = data1;
          } catch (e) { };          
          resolve(res.data);
        } else {
          wx.showToast({
            title: `网络错误(${res.statusCode})`,
            icon: 'none'
          })
          reject(res)
        }
      },
      fail(err) {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = {
  get: (url, data) => request(url, 'GET', data),
  post: (url, data) => request(url, 'POST', data),
}
