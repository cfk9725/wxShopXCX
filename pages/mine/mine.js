var app = getApp()
var { post } = require('../../utils/request.js');
var util = require('../../utils/util.js');
var QQMapWX = require('../../utils/qqmap-wx-jssdk.min');
var qqmapsdk = new QQMapWX({ key: 'UPTBZ-VR3OG-U5WQJ-QNIS6-5RKR5-5DBP4' });

Page({
  data: {
    TOKEN_KEY: app.globalData.TOKEN_KEY,
    USER_KEY: app.globalData.USER_KEY,
    
    wxImg: app.globalData.baseUrl + "/img/wx.png",  

    showPopup: false,
    defaultImg: app.globalData.baseUrl + "/img/defaultUserImg.png",
    userImg: app.globalData.baseUrl + "/img/defaultUserImg.png",  
    nickName: '',
    phoneNumber: '',

    showLoginPopup: false,
    username: '',
    userpwd: '',

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
      // { key: 'coupon', icon: '🎟️', text: '优惠券' },
      { key: 'favorite', icon: '⭐', text: '我的收藏' },
      { key: 'service', icon: '🎧', text: '联系客服' },
      { key: 'about', icon: 'ℹ️', text: '关于我们' },
    ],    

    showShDzPopup: false,

    showShDzSzPopup: false,
    
    //腾讯地图相关
    keyword: '',
    latitude: 39.9042,
    longitude: 116.4074,
    markers: [],
    maplist: [],    
    //腾讯地图相关

    shDzlist: [],

    //收件人信息
    sjrId: 0,             //收件人id
    sjrRecipientName: "", //收件人姓名
    sjrMobile: "",        //收件人手机号
    sjrStreet: "",        //详细街道地址
    sjrPostalCode: "",    //邮政编码
    sjrIsDefault: 0,      //是否默认地址
    sjrLongitude: 0,      //经度
    sjrLatitude: 0,       //纬度
    //收件人信息
  },

  onShow() {
    // 如果未登录，自动触发登录
    if (!this.isLoggedIn() && app.globalData.isAutoLogin) {
      this.login(1);
    } else if (this.isLoggedIn()) {
      this._syncUserInfo();
    }
  }, 

  isLoggedIn() {
    var token = app.globalData.token || wx.getStorageSync(this.data.TOKEN_KEY) || '';
    return !!token;
  },
  
  _syncUserInfo() {
    var cachedToken = wx.getStorageSync(this.data.TOKEN_KEY);
    var token = app.globalData.token || cachedToken || "";
    var cached = wx.getStorageSync(this.data.USER_KEY);
    var userInfo = app.globalData.userInfo || cached || null;
    var isLoggedIn = this.isLoggedIn();
    this.saveAuth(token, userInfo);
    this.setData({ userImg: userInfo.AvatarUrl, userInfo, isLoggedIn });
  },

  saveAuth(token, userInfo) {
    var app = getApp()
    app.globalData.token = token;
    app.globalData.userInfo = userInfo;
    app.globalData.isAutoLogin = true;
    wx.setStorageSync(this.data.TOKEN_KEY, token)
    if (userInfo) {
      wx.setStorageSync(this.data.USER_KEY, userInfo)
    }
  },
  clearAuth() {
    var app = getApp()
    app.globalData.token = null;
    app.globalData.userInfo = null;
    app.globalData.isAutoLogin = false;
    wx.removeStorageSync(this.data.TOKEN_KEY);
    wx.removeStorageSync(this.data.USER_KEY);
    this.setData({ userImg: this.data.defaultImg, userInfo: null, isLoggedIn: false });
  },
  // -- 点击"点击登录"文字区域：获取图片昵称，修改昵称 --
  onLoginTap() {
    this.showLoginPopup();
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
              that.setData({ 
                userInfo: result.Data.userInfo, 
                userImg: result.Data.userInfo.AvatarUrl,
                isLoggedIn: true,
              });
              callback && callback(1);
              return;
            }
            that.clearAuth();
            if(isNotTs) {
              callback && callback(0);
              return;
            }
            wx.showToast({
              title: "还未注册，请先注册",
              icon: 'none',
            })
            that.showRegisterPopup();
            callback && callback(0);
          },
        })
      },
    });
  },

  // -- 选择头像（微信官方 chooseAvatar） --
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl
    if (!avatarUrl) return;
    this.uploadAvatar(avatarUrl);
  },  

  // 2. 封装上传逻辑
  uploadAvatar(tempFilePath) {
    var that = this;
    var guidCode = util.guid();
    wx.uploadFile({
      // 替换为你自己的后端接口地址
      url: app.globalData.baseUrl + '/api/WeChat/uploadFjs?r=' + Math.random(), 
      header: {
        'Cookie': 'x-custom-token=' + app.globalData.token
      },
      filePath: tempFilePath, // 临时文件路径
      name: 'file',         // 后端通过该字段名获取文件
      // 可携带 userId、token 等业务参数
      formData: { guidCode: guidCode }, 
      fail: (err) => {
        wx.showToast({
          title: err.errMsg,
          icon: 'none',
        })
      },
      success: (res) => {
        // 注意：res.data 默认是字符串，需要手动解析
        var result = JSON.parse(res.data);
        if (result.code == 1) {
          wx.showToast({
            title: result.Message,
            icon: 'none',
          })
          return;
        } 
        var userImg = app.globalData.baseUrl + '/api/WeChat/FjPreview?EncryptedData=' + util.encode({ 
          guidCode: guidCode 
        });
        if(this.data.userInfo) this.data.userInfo.AvatarUrl = userImg;   
        that.setData({ 
          userImg: userImg,
        });
      },
    });
  },

  // 显示弹窗
  showRegisterPopup() {
    this.setData({ showPopup: true });
  },

  // 隐藏弹窗
  hideRegisterPopup() {
    this.setData({ showPopup: false });
  },

  // 监听输入
  onNickNameInput(e) {
    this.setData({ nickName: e.detail.value });
  },

  // 监听输入
  onPhoneNumberInput(e) {
    this.setData({ phoneNumber: e.detail.value });
  },

  // 确认提交
  onRegisterConfirm() {
    var that = this;
    if (!that.data.nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    var phoneNumber = that.data.phoneNumber || '';
    if (phoneNumber.length > 0 && phoneNumber.length != 11) {
      wx.showToast({ title: '手机号只能是11位', icon: 'none' });
      return;
    }
    if(!(/^1[3-9]\d{9}$/.test(phoneNumber))) {      
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '注册中...' });    
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
        post('/api/WeChat/RegisterUser', {
          data: {
            code: res.code, 
            userInfo: JSON.stringify({
              nickName: that.data.nickName,
              avatarUrl: that.data.userImg,
              phoneNumber: that.data.phoneNumber,
            })
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
            if(!result.Data.userInfo.AvatarUrl) result.Data.userInfo.AvatarUrl = that.data.defaultImg;         
            that.saveAuth(result.Data.token, result.Data.userInfo);
            that.setData({ 
              userInfo: result.Data.userInfo, 
              userImg: result.Data.userInfo.AvatarUrl,
              isLoggedIn: true,
            });            

            // TODO：这里可以把昵称传给服务器
            that.hideRegisterPopup();
          }
        })
      }
    });
  },

  // -- 退出登录 --
  onLogout() {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          that.clearAuth();
          wx.showToast({ title: '已退出', icon: 'none' });
        }
      }
    })
  },  

  showLoginPopup() {
    this.setData({ showLoginPopup: true });
  },

  hideLoginPopup() {
    this.setData({ showLoginPopup: false });
  },

  onUserNameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onUserPwdInput(e) {
    this.setData({ userpwd: e.detail.value });
  },

  onLoginConfirm () {
    var that = this;
    if (!that.data.username.trim()) {
      wx.showToast({ title: '请输入账户', icon: 'none' });
      return;
    }
    if (!that.data.userpwd.trim()) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '登录中...' });
    post('/api/WeChat/Login1', {          
      data: {
        username: that.data.username,
        userpwd: that.data.userpwd
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
          that.hideLoginPopup();
          return;
        }
        that.clearAuth();
        if(isNotTs) return;
        wx.showToast({
          title: "还未注册，请先注册",
          icon: 'none',
        })
        that.hideLoginPopup();
        that.showRegisterPopup();
      },
    })
  },

  onWxLoginConfirm () {
    var that = this;
    that.login(null, function(isSuccess) {
      if(isSuccess == 1) {
        that.hideLoginPopup();
      }
      else if(that.data.showPopup) {
        that.hideLoginPopup();
      }
    });
  },

  onBindingWx() {
    var that = this;
    wx.showLoading({ title: '绑定中...' });
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
        post('/api/WeChat/BindingWx', {          
          data: {
            code: res.code,
            id: that.data.userInfo.Id
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
            if(!result.Data.userInfo.AvatarUrl) result.Data.userInfo.AvatarUrl = that.data.userImg;              
            that.saveAuth(result.Data.token, result.Data.userInfo);
            that.setData({ 
              userInfo: result.Data.userInfo, 
              userImg: result.Data.userInfo.AvatarUrl,
            });
          },
        })
      },
    });
  },

  onOrderTap() {
    wx.showToast({ title: '订单功能开发中', icon: 'none' })
  },

  onFuncTap(e) {
    var that = this;
    if(!that.data.userInfo) {      
      wx.showToast({
        title: "请先登录",
        icon: 'none',
      })
      return;
    }
    var key = e.currentTarget.dataset.key;
    switch(key)
    {
      case "address":
        that.showShDzPopup();
        that.GetShDzs();
        break;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' })
        break;
    }
  },   

  showShDzPopup() {
    this.setData({ showShDzPopup: true });
  },

  hideShDzPopup() {
    this.setData({ showShDzPopup: false });
  },  

  showShDzSzPopup() {
    this.setData({ showShDzSzPopup: true });
  },

  hideShDzSzPopup() {
    this.setData({ showShDzSzPopup: false });
  },

  onBtnAddShDz() {
    var that = this;
    that.setData({
      sjrRecipientName: that.data.userInfo.RealName || that.data.userInfo.NickName,
      sjrMobile: that.data.userInfo.Mobile || "",
      sjrStreet: "",
      sjrPostalCode: "",
      sjrIsDefault: 0,
    });
    this.showShDzSzPopup();
    this.getMyLocation();
  },

  //腾讯地图相关
  // 1. 获取当前位置
  getMyLocation() {
    var that = this;
    wx.getLocation({
      type: 'gcj02', // 腾讯/微信地图都用 gcj02
      success: (res) => {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          markers: [{
            id: 0,
            latitude: res.latitude,
            longitude: res.longitude,
            title: '我的位置',
            width: 32, height: 32,
          }]
        })
      },
      fail: function(err) { 
        console.log(err.errMsg);
        wx.showToast({ title: err.errMsg, icon: 'none' });
      }
    })
  },

  onMapInput(e) { 
    this.setData({ keyword: e.detail.value }) 
  },

  // 2. 关键词搜索 POI
  onMapSearch() { 
    var that = this;
    var kw = that.data.keyword.trim();
    if (!kw) return
    qqmapsdk.search({
      keyword: kw,
      // location: `${that.data.latitude},${that.data.longitude}`,
      page_size: 20,
      success: (res) => {
        var list = res.data.map(p => ({
          id: p.id,
          title: p.title,
          address: p.address,
          latitude: p.location.lat,
          longitude: p.location.lng,
        }))
        that.setData({ maplist: list })
      },
      fail: (err) => console.error(err)
    })
  },

  // 3. 选中某个搜索结果 → 地图中心移动
  onMapSelect(e) {
    var that = this;
    var item = e.currentTarget.dataset.item
    that.setData({
      latitude: item.latitude,
      longitude: item.longitude,
      markers: [{
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.title,
        width: 32, height: 32,
      }],
      sjrLatitude: item.latitude,
      sjrLongitude: item.longitude,
      sjrStreet: item.address,
    })
    // 这里就已经“获取位置”了
    // wx.showToast({ title: `已选：${item.title}`, icon: 'none' })
    console.log('选中位置:', item)
  },

  onMapTap() {},
  
  //腾讯地图相关

  onIsDefaultChange(e) {
    this.setData({
      sjrIsDefault: e.detail.value.length > 0 ? 1 : 0
    });
  },

  GetShDzs() {
    var that = this;
    post('/api/WeChat/GetShDzs', {
      data: {
        userID: that.data.userInfo.Id,
      },
      success: function (result) {
        if(result.StatusCode == 0) { //报错
          wx.showToast({
            title: result.Message,
            icon: 'none',
          })
          return
        }
        that.setData({ shDzlist: result.Data })
      }
    })
  },

  onBtnSaveShDzSz() {    
    var that = this;
    wx.showLoading({ title: '设置中...' });
    post('/api/WeChat/AddShDz', {
      data: {
        id: that.data.sjrId, 
        userID: that.data.userInfo.Id,
        sjrRecipientName: that.data.sjrRecipientName,
        sjrMobile: that.data.sjrMobile,
        sjrStreet: that.data.sjrStreet,
        sjrPostalCode: that.data.sjrPostalCode,
        sjrIsDefault: that.data.sjrIsDefault,
        sjrLongitude: that.data.sjrLongitude,
        sjrLatitude: that.data.sjrLatitude,
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
        that.GetShDzs();
        that.hideShDzSzPopup();
      }
    })
  },
  
  onMapSelect(e) {
    var that = this;
    var item = e.currentTarget.dataset.item
    that.setData({
      latitude: item.latitude,
      longitude: item.longitude,
      markers: [{
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.title,
        width: 32, height: 32,
      }],
      sjrLatitude: item.latitude,
      sjrLongitude: item.longitude,
      sjrStreet: item.address,
    })
    // 这里就已经“获取位置”了
    // wx.showToast({ title: `已选：${item.title}`, icon: 'none' })
    console.log('选中位置:', item)
  },
})
