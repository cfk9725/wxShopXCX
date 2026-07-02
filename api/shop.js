/**
 * 商城 API 接口层
 * 所有后端接口调用集中管理
 */

const { get, post } = require('../utils/request.js')

module.exports = {
  // 获取首页轮播图
  getBanners: () => get('/api/banners'),

  // 获取分类列表
  getCategories: () => get('/api/categories'),

  // 获取商品列表（支持按分类筛选）
  getGoodsList: (categoryId) => get('/api/goods', categoryId ? { categoryId } : {}),

  // 获取商品详情
  getGoodsDetail: (id) => get('/api/goods/' + id),

  // 获取用户信息
  getUserInfo: () => get('/api/user/info'),

  // 提交订单
  submitOrder: (orderData) => post('/api/order/submit', orderData)
}
