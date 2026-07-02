const shopApi = require('../../api/shop.js')

Page({
  data: {
    goods: null,
    loading: true
  },

  onLoad(options) {
    const id = options.id
    this.loadGoodsDetail(id)
  },

  // 通过 API 获取商品详情
  async loadGoodsDetail(id) {
    try {
      const goods = await shopApi.getGoodsDetail(id)
      if (goods) {
        this.setData({ goods, loading: false })
        wx.setNavigationBarTitle({ title: goods.name })
      }
    } catch (err) {
      console.error('商品详情加载失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
    }
  },

  // 加入购物车
  onAddCart() {
    const app = getApp()
    app.addToCart(this.data.goods)
    const count = app.getCartCount()
    wx.setTabBarBadge({ index: 1, text: String(count) })
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  // 立即购买
  onBuyNow() {
    const app = getApp()
    app.addToCart(this.data.goods)
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  },

  // 跳转购物车
  goCart() {
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  }
})
