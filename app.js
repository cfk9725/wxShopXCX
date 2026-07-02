App({
  globalData: {
    userInfo: null,
    cart: [],
    // API 服务器地址 - 改成你自己的后端地址
    // 本地开发用 mock 服务器：http://localhost:3000
    // 生产环境替换为实际域名（需在微信后台配置 request 合法域名）
    baseUrl: 'http://localhost:3000'
  },

  onLaunch() {
    // 从本地存储恢复购物车
    const cart = wx.getStorageSync('cart')
    if (cart) {
      this.globalData.cart = cart
    }
  },

  // 添加到购物车
  addToCart(goods) {
    const cart = this.globalData.cart
    const existing = cart.find(item => item.id === goods.id)
    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({ ...goods, quantity: 1 })
    }
    this.globalData.cart = cart
    wx.setStorageSync('cart', cart)
  },

  // 获取购物车数量
  getCartCount() {
    return this.globalData.cart.reduce((sum, item) => sum + item.quantity, 0)
  }
})
