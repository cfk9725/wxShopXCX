Page({
  data: {
    cartList: [],
    allChecked: true,
    totalPrice: '0.00',
    totalCount: 0
  },

  onShow() {
    this.loadCart()
  },

  // 加载购物车数据
  loadCart() {
    const app = getApp()
    const cart = app.globalData.cart.map(item => ({
      ...item,
      checked: item.checked !== undefined ? item.checked : true
    }))
    app.globalData.cart = cart
    this.setData({ cartList: cart })
    this.updateTotal()
    this.updateBadge()
  },

  // 切换选中
  toggleCheck(e) {
    const index = e.currentTarget.dataset.index
    const cartList = this.data.cartList
    cartList[index].checked = !cartList[index].checked
    this.setData({ cartList })
    this.updateTotal()
    this.saveCart()
  },

  // 全选/取消全选
  toggleAll() {
    const allChecked = !this.data.allChecked
    const cartList = this.data.cartList.map(item => ({
      ...item,
      checked: allChecked
    }))
    this.setData({ cartList, allChecked })
    this.updateTotal()
    this.saveCart()
  },

  // 增加数量
  increaseQty(e) {
    const index = e.currentTarget.dataset.index
    const cartList = this.data.cartList
    cartList[index].quantity += 1
    this.setData({ cartList })
    this.updateTotal()
    this.saveCart()
  },

  // 减少数量
  decreaseQty(e) {
    const index = e.currentTarget.dataset.index
    const cartList = this.data.cartList
    if (cartList[index].quantity > 1) {
      cartList[index].quantity -= 1
    } else {
      // 数量为1时移除
      cartList.splice(index, 1)
    }
    this.setData({ cartList })
    this.updateTotal()
    this.saveCart()
    this.updateBadge()
  },

  // 更新合计
  updateTotal() {
    const checkedItems = this.data.cartList.filter(item => item.checked)
    const total = checkedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const count = checkedItems.reduce((sum, item) => sum + item.quantity, 0)
    const allChecked = this.data.cartList.length > 0 && this.data.cartList.every(item => item.checked)
    this.setData({
      totalPrice: total.toFixed(2),
      totalCount: count,
      allChecked
    })
  },

  // 保存购物车
  saveCart() {
    const app = getApp()
    app.globalData.cart = this.data.cartList
    wx.setStorageSync('cart', this.data.cartList)
  },

  // 更新角标
  updateBadge() {
    const app = getApp()
    const count = app.getCartCount()
    if (count > 0) {
      wx.setTabBarBadge({ index: 1, text: String(count) })
    } else {
      wx.removeTabBarBadge({ index: 1 })
    }
  },

  // 结算
  onCheckout() {
    const checkedItems = this.data.cartList.filter(item => item.checked)
    if (checkedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '结算功能开发中',
      icon: 'none'
    })
  }
})
