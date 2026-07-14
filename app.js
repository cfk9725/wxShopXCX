App({
  globalData: {    
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'userInfo',
    
    token: '',              // 登录 token
    userInfo: null,         // 用户信息（头像、昵称等）
    cart: [],               // 购物车数据
    // API 服务器地址 - 改成你自己的后端地址
    // 本地开发用 mock 服务器：http://localhost:3000
    // 生产环境替换为实际域名（需在微信后台配置 request 合法域名）
    baseUrl: 'http://localhost:57656',
    isAutoLogin: false, //是否自动登录
  },

  onLaunch() {
    // 1. 从本地缓存恢复购物车
    const cart = wx.getStorageSync('cart')
    if (cart) {
      this.globalData.cart = cart
    }

    var auth = require('./utils/auth.js'); 
    auth.init(this);
    // 2. 从本地缓存恢复登录态（token + userInfo）
    auth._syncUserInfo();

    // 3. 如果已有 token 则无需重复登录
    if (auth.isLoggedIn()) {
      console.log('[App] 已登录，token 有效')
      return
    }

    // 4. 无 token：静默执行微信登录，获取 code 换 token
    console.log('[App] 未登录，执行静默登录...')
    auth.login(1);
  },

  // 添加到购物车
  addToCart(goods) {
    // const cart = this.globalData.cart
    // const existing = cart.find(item => item.id === goods.id)
    // if (existing) {
    //   existing.quantity += 1
    // } else {
    //   cart.push({ ...goods, quantity: 1 })
    // }
    // this.globalData.cart = cart
    // wx.setStorageSync('cart', cart) 
  },

  // 获取购物车数量
  getCartCount() {
    // return this.globalData.cart.reduce((sum, item) => sum + item.quantity, 0)
  }
})
