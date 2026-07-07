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
        wx.getUserProfile({
          desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
          success: (res1) => {
            console.log(res);
            console.log(res1);
            // 将 code 发给后端，换取 token + 用户信息
            post('/api/WeChat/RegisterUser', { code: res.code, userInfo: JSON.stringify(res1.userInfo) })
              .then(data => {
                var token = data.token
                var userInfo = data.userInfo || null
                if(userInfo) {
                  userInfo.avatar_url = res1.userInfo.avatarUrl
                }
                // 持久化
                saveAuth(token, userInfo)
                resolve({ token, userInfo })
              })
              .catch(reject)
          }
        })
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
  return new Promise((resolve, reject) => {
    post('/api/WeChat/RegisterUser1', {
      id: profile.id || 0,
      nickName: profile.nick_name || '微信用户',
      avatarUrl: profile.avatar_url || ''
    }).then(data => {
      saveAuth(data.token, data.userInfo)
      resolve(data.userInfo);
    })
    .catch(reject)
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
