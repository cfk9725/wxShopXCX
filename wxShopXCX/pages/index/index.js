const shopApi = require('../../api/shop.js')

Page({
  data: {
    banners: [],
    categories: [],
    goodsList: [],
    loading: true
  },

  onLoad() {
    this.loadAllData()
  },

  onShow() {
    // 更新购物车角标
    const app = getApp()
    const count = app.getCartCount()
    if (count > 0) {
      wx.setTabBarBadge({ index: 1, text: String(count) })
    } else {
      wx.removeTabBarBadge({ index: 1 })
    }
  },

  // 并行加载轮播图、分类、商品列表
  async loadAllData() {
    try {
      const [banners, categories, goodsList] = await Promise.all([
        shopApi.getBanners(),
        shopApi.getCategories(),
        shopApi.getGoodsList()
      ])
      this.setData({
        banners: banners || [],
        categories: categories || [],
        goodsList: goodsList || [],
        loading: false
      })
    } catch (err) {
      console.error('首页数据加载失败:', err)
      this.setData({ loading: false })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAllData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 搜索
  onSearchTap() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    })
  },

  // 分类点击
  onCategoryTap(e) {
    const name = this.data.categories.find(c => c.id === e.currentTarget.dataset.id)?.name
    wx.showToast({
      title: `分类：${name}`,
      icon: 'none'
    })
  },

  // 跳转商品详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/goods/goods?id=${id}`
    })
  },

  // 加入购物车
  onAddCart(e) {
    const app = getApp()
    const id = e.currentTarget.dataset.id
    const goods = this.data.goodsList.find(g => g.id === id)
    if (goods) {
      app.addToCart(goods)
      const count = app.getCartCount()
      wx.setTabBarBadge({ index: 1, text: String(count) })
      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      })
    }
  }
})
