/**
 * 微信登录 & 鉴权工具模块
 *
 * 流程：
 *   1. wx.login() 获取 code
 *   2. code 发往后端换取 openid / session_key 和自定义 token
 *   3. token 写入 globalData + 本地缓存，后续请求携带 token
 */

const { post } = require('./request.js')

// -- 缓存 key 名称 --
const TOKEN_KEY = 'auth_token'
const USER_KEY  = 'userInfo'

/**
 * 执行微信登录，获取 code，并发给后端换取 token 和用户信息
 * @returns {Promise<{ token: string, userInfo: object }>}
 */
function doLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) {
          reject(new Error('wx.login 未返回 code'))
          return
        }
        // 将 code 发给后端，换取 token + 用户信息
        post('/api/user/login', { code: res.code })
          .then(data => {
            const token = data.token
            const userInfo = data.userInfo || null
            // 持久化
            saveAuth(token, userInfo)
            resolve({ token, userInfo })
          })
          .catch(reject)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 注册用户信息（头像 + 昵称）到后端
 * @param {object} profile - { nickName, avatarUrl }
 * @returns {Promise<object>} 后端返回的完整用户信息
 */
function registerUser(profile) {
  const app = getApp()
  const token = getToken()
  return post('/api/user/register', {
    nickName: profile.nickName || '微信用户',
    avatarUrl: profile.avatarUrl || ''
  }).then(data => {
    const userInfo = data.userInfo || data
    // 合并已有 token 与新用户信息
    saveAuth(token, userInfo)
    return userInfo
  })
}

/**
 * 保存登录态到内存和本地缓存
 */
function saveAuth(token, userInfo) {
  const app = getApp()
  app.globalData.token = token
  app.globalData.userInfo = userInfo
  wx.setStorageSync(TOKEN_KEY, token)
  if (userInfo) {
    wx.setStorageSync(USER_KEY, userInfo)
  }
}

/**
 * 从缓存中恢复登录态（app.js onLaunch 调用）
 */
function restoreAuth() {
  const app = getApp()
  const token = wx.getStorageSync(TOKEN_KEY)
  const userInfo = wx.getStorageSync(USER_KEY)
  if (token) {
    app.globalData.token = token
  }
  if (userInfo) {
    app.globalData.userInfo = userInfo
  }
  return { token: token || null, userInfo: userInfo || null }
}

/**
 * 获取当前 token
 */
function getToken() {
  const app = getApp()
  return app.globalData.token || wx.getStorageSync(TOKEN_KEY) || ''
}

/**
 * 判断是否已登录（有有效 token）
 */
function isLoggedIn() {
  return !!getToken()
}

/**
 * 清除登录态
 */
function logout() {
  const app = getApp()
  app.globalData.token = ''
  app.globalData.userInfo = null
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
}

module.exports = {
  doLogin,
  registerUser,
  restoreAuth,
  getToken,
  isLoggedIn,
  logout
}
