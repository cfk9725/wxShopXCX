Page({
  data: {
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

  onOrderTap(e) {
    wx.showToast({
      title: '订单功能开发中',
      icon: 'none'
    })
  },

  onFuncTap(e) {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }
})
