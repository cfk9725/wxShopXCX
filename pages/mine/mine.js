const app = getApp()
const auth = require('../../utils/auth.js')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,      // 是否已完成 token 登录
    loginLoading: false,    // 登录中
    orderStatus: [
      { key: 'pending', icon: '💰', text: '待付款' },
      { key: 'paid', icon: '📦', text: '待发货' },
      { key: 'shipped', icon: '🚚', text: '待收货' },
      { key: 'done', icon: '✅', text: '已完成' },
    ],
    funcList: [
      { key: 'address', icon: '📍', text: '收货地址' },
      { key: 'coupon', icon: '🎟️', text: '优惠券' },
      { key: 'favorite', icon: '⭐', text: '我的收藏' },
      { key: 'service', icon: '🎧', text: '联系客服' },
      { key: 'about', icon: 'ℹ️', text: '关于我们' },
    ]
  },

  onShow() {
    this._syncUserInfo()
    // 如果未登录，自动触发登录
    if (!auth.isLoggedIn() && !this.data.loginLoading) {
      this._autoLogin()
    }
  },

  // -- 同步用户信息到页面 --
  _syncUserInfo() {
    const cached = wx.getStorageSync('userInfo')
    const userInfo = app.globalData.userInfo || cached || null
    const isLoggedIn = auth.isLoggedIn()
    this.setData({ userInfo, isLoggedIn })
  },

  // -- 静默登录：wx.login → code 换 token --
  _autoLogin() {
    this.setData({ loginLoading: true })
    auth.doLogin()
      .then(({ token, userInfo }) => {
        console.log('[Mine] 静默登录成功')
        this._syncUserInfo()
        this.setData({ loginLoading: false })
      })
      .catch(err => {
        console.error('[Mine] 静默登录失败:', err)
        this.setData({ loginLoading: false })
      })
  },

  // -- 选择头像（微信官方 chooseAvatar） --
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    if (!avatarUrl) return

    const cached = wx.getStorageSync('userInfo') || {}
    const userInfo = {
      avatarUrl,
      nickName: cached.nickName || '微信用户'
    }
    // 先存本地
    this._saveLocal(userInfo)
    // 如果已登录，同步到后端
    this._registerToServer(userInfo)
  },

  // -- 点击"点击登录"文字区域：输入昵称 --
  onLoginTap() {
    const that = this
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success(res) {
        if (res.confirm && res.content) {
          const cached = wx.getStorageSync('userInfo') || {}
          const userInfo = {
            avatarUrl: cached.avatarUrl || '',
            nickName: res.content
          }
          that._saveLocal(userInfo)
          // 如果已登录，同步到后端
          that._registerToServer(userInfo)
        }
      }
    })
  },

  // -- 存本地（globalData + storage） --
  _saveLocal(userInfo) {
    app.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
    this.setData({ userInfo })
  },

  // -- 发请求到后端注册/更新用户信息 --
  _registerToServer(userInfo) {
    if (!auth.isLoggedIn()) {
      // 还没拿到 token，先尝试登录再注册
      wx.showLoading({ title: '登录中...' })
      auth.doLogin()
        .then(() => {
          wx.showLoading({ title: '注册中...' })
          return auth.registerUser(userInfo)
        })
        .then(serverUserInfo => {
          wx.hideLoading()
          this._syncUserInfo()
          wx.showToast({ title: '登录成功', icon: 'success' })
        })
        .catch(err => {
          wx.hideLoading()
          console.error('[Mine] 注册失败:', err)
          // 即使后端注册失败，本地信息也已保存
          this._syncUserInfo()
          wx.showToast({ title: '已保存（离线模式）', icon: 'none' })
        })
      return
    }

    // 已有 token，直接注册
    wx.showLoading({ title: '保存中...' })
    auth.registerUser(userInfo)
      .then(serverUserInfo => {
        wx.hideLoading()
        this._syncUserInfo()
        wx.showToast({ title: '保存成功', icon: 'success' })
      })
      .catch(err => {
        wx.hideLoading()
        console.error('[Mine] 注册失败:', err)
        this._syncUserInfo()
        wx.showToast({ title: '网络异常，已本地保存', icon: 'none' })
      })
  },

  // -- 退出登录 --
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout()
          this.setData({ userInfo: null, isLoggedIn: false })
          wx.showToast({ title: '已退出', icon: 'none' })
        }
      }
    })
  },

  onOrderTap() {
    wx.showToast({ title: '订单功能开发中', icon: 'none' })
  },

  onFuncTap(e) {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})
