/**
 * 网络请求封装 - Promise 化 wx.request
 * 支持跨域请求，统一错误处理
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
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200 && res.data) {
          // 约定返回格式：{ code: 0, data: ..., message: 'ok' }
          if (res.data.code === 0) {
            resolve(res.data.data)
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
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
  put: (url, data) => request(url, 'PUT', data),
  del: (url, data) => request(url, 'DELETE', data)
}
