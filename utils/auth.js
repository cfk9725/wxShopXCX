
var { post } = require('./request.js');

var app = getApp();
var TOKEN_KEY = app && app.globalData && app.globalData.TOKEN_KEY ? app.globalData.TOKEN_KEY : "";
var USER_KEY = app && app.globalData && app.globalData.USER_KEY ? app.globalData.USER_KEY : "";

module.exports = {
  init: function(currApp) {
    app = currApp;
    TOKEN_KEY = app.globalData.TOKEN_KEY;
    USER_KEY = app.globalData.USER_KEY;
  },
  isLoggedIn: function () {
    var token = app.globalData.token || wx.getStorageSync(TOKEN_KEY) || '';
    return !!token;
  },  
  _syncUserInfo: function () {
    var cachedToken = wx.getStorageSync(TOKEN_KEY);
    var token = app.globalData.token || cachedToken || "";
    var cached = wx.getStorageSync(USER_KEY);
    var userInfo = app.globalData.userInfo || cached || null;
    this.saveAuth(token, userInfo);
  },
  saveAuth: function (token, userInfo) {
    app.globalData.token = token;
    app.globalData.userInfo = userInfo;
    app.globalData.isAutoLogin = true;
    wx.setStorageSync(TOKEN_KEY, token)
    if (userInfo) {
      wx.setStorageSync(USER_KEY, userInfo)
    }
  },
  clearAuth: function () {
    app.globalData.token = null;
    app.globalData.userInfo = null;
    app.globalData.isAutoLogin = false;
    wx.removeStorageSync(TOKEN_KEY);
    wx.removeStorageSync(USER_KEY);
  },
  login(isNotTs, callback) {
    var that = this
    if(!isNotTs) wx.showLoading({ title: '登录中...' });
    wx.login({
      fail(err) {
        if(!isNotTs) wx.hideLoading();
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
        callback && callback(0);
      },
      success(res) {
        if (!res.code) {
          if(!isNotTs) wx.hideLoading();
          wx.showToast({
            title: 'wx.login 未返回 code',
            icon: 'none',
          })
          callback && callback(0);
          return
        }
        post('/api/WeChat/Login', {          
          data: {
            code: res.code
          },
          success: function (result) {
            if(!isNotTs) wx.hideLoading();
            if(result.StatusCode == 0) { //报错
              wx.showToast({
                title: result.Message,
                icon: 'none',
              })
              callback && callback(0);
              return
            }
            if(result.StatusCode == 1) { //登陆成功
              if(!result.Data.userInfo.AvatarUrl) result.Data.userInfo.AvatarUrl = that.data.userImg;              
              that.saveAuth(result.Data.token, result.Data.userInfo);
              callback && callback(1);
              return;
            }
            callback && callback(0);
            that.clearAuth();
            if(isNotTs) return;
            wx.showToast({
              title: "还未注册，请先注册",
              icon: 'none',
            })
          },
        })
      },
    });
  } 
}