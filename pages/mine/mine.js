var app = getApp()
var { post } = require('../../utils/request.js')

Page({
  data: {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'userInfo',

    showPopup: false,
    userImg: app.globalData.baseUrl + "/img/defaultUserImg.png",    
    nickName: '',

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
    this.showInputPopup();
    this._syncUserInfo()
    // 如果未登录，自动触发登录
    if (!auth.isLoggedIn() && !this.data.loginLoading) {
      this._autoLogin()
    }
  }, 

  saveAuth(token, userInfo) {
    var app = getApp()
    app.globalData.token = token;
    app.globalData.userInfo = userInfo;
    wx.setStorageSync(this.data.TOKEN_KEY, token)
    if (userInfo) {
      wx.setStorageSync(this.data.USER_KEY, userInfo)
    }
  },
  // -- 点击"点击登录"文字区域：获取图片昵称，修改昵称 --
  onLoginTap() { debugger
    var that = this
    wx.showLoading({ title: '登录中...' });
    wx.login({
      fail(err) {
        wx.hideLoading();
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
      },
      success(res) {
        if (!res.code) {
          wx.hideLoading();
          wx.showToast({
            title: 'wx.login 未返回 code',
            icon: 'none',
          })
          return
        }
        post('/api/WeChat/Login', {          
          data: {
            code: res.code
          },
          success: function (result) {
            wx.hideLoading();
            if(result.StatusCode == 0) { //报错
              wx.showToast({
                title: result.Message,
                icon: 'none',
              })
              return
            }
            if(result.StatusCode == 1) { //登陆成功
              if(!result.Data.userInfo.AvatarUrl) result.Data.userInfo.AvatarUrl = that.data.userImg;              
              that.saveAuth(result.Data.token, result.Data.userInfo);
              that.setData({ 
                userInfo: result.Data.userInfo, 
                userImg: result.Data.userInfo.AvatarUrl,
                isLoggedIn: true,
              });
              return;
            }
            wx.showToast({
              title: "还未注册，请先注册",
              icon: 'none',
            })
            that.showInputPopup();
          },
        })
      },
    });
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
  onChooseAvatar(e) {debugger
    console.log("11111");
    const avatarUrl = e.detail.avatarUrl
    if (!avatarUrl) return

    const cached = wx.getStorageSync('userInfo') || {}
    const userInfo = {
      avatar_url: avatarUrl,
      nick_name: cached.nickName || '微信用户'
    }
    // 如果已登录，同步到后端
    this._registerToServer(userInfo, function() {
      this._saveLocal(userInfo)
    })
  },

  // -- 存本地（globalData + storage） --
  _saveLocal(userInfo) {
    app.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
    this.setData({ userInfo })
  },

  // -- 发请求到后端注册/更新用户信息 --
  _registerToServer(userInfo, callback) {
    if (!auth.isLoggedIn()) {
      // 还没拿到 token，先尝试登录再注册
      wx.showLoading({ title: '登录中...' })
      auth.doLogin()
        .then(serverUserInfo => {
          wx.hideLoading()
          this._syncUserInfo()
          wx.showToast({ title: '登录成功', icon: 'success' })
          callback && callback();
        })
        .catch(err => {
          wx.hideLoading()
          console.error('[Mine] 注册失败:', err)
          wx.showToast({ title: '登录失败', icon: 'none' })
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
        callback && callback();
      })
      .catch(err => {
        wx.hideLoading()
        console.error('[Mine] 注册失败:', err)
        wx.showToast({ title: '登录失败', icon: 'none' })
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
  },  

  // 显示弹窗
  showInputPopup() {
    this.setData({ showPopup: true });
  },

  // 隐藏弹窗
  hideInputPopup() {
    this.setData({ showPopup: false });
  },

  // 监听输入
  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  // 确认提交
  onConfirm() {
    if (!this.data.nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    console.log('用户输入的昵称：', this.data.nickName);

    // TODO：这里可以把昵称传给服务器
    this.hideInputPopup();
  },
})
