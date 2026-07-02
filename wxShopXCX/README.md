# 微信商城小程序

一个简洁的微信商城小程序，支持跨域 API 请求，可直接导入微信开发者工具使用。

## 项目结构

```
├── app.js                    # 入口文件（全局配置、购物车逻辑）
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 开发者工具项目配置
├── sitemap.json              # 搜索配置
├── utils/
│   └── request.js            # 网络请求封装（Promise 化 wx.request）
├── api/
│   └── shop.js               # 商城 API 接口层
├── server/
│   └── mock-server.js        # 本地 Mock API 服务器（零依赖，纯 Node.js）
└── pages/
    ├── index/                # 首页（轮播图 + 分类 + 商品列表）
    ├── goods/                # 商品详情
    ├── cart/                 # 购物车
    └── mine/                 # 个人中心
```

## 快速开始

### 1. 启动 Mock 服务器

```bash
cd server
node mock-server.js
```

服务器运行在 `http://localhost:3000`，提供以下接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/banners | 轮播图列表 |
| GET | /api/categories | 分类列表 |
| GET | /api/goods | 商品列表（可选参数 categoryId 筛选） |
| GET | /api/goods/:id | 商品详情 |
| GET | /api/user/info | 用户信息 |
| POST | /api/order/submit | 提交订单 |

> Mock 服务器使用纯 Node.js，**无需安装任何依赖**，直接 `node mock-server.js` 即可运行。

### 2. 导入微信开发者工具

1. 打开微信开发者工具 → 选择「导入项目」
2. 项目目录选择本文件夹
3. AppID 填自己的或选「测试号」
4. 点击确定

### 3. 关键设置（跨域请求）

在微信开发者工具中：

**详情 → 本地设置 → 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**

> 这样才能在开发阶段请求 `http://localhost:3000`。生产环境需在微信公众平台配置 request 合法域名。

## API 配置

在 `app.js` 中修改 `baseUrl`：

```js
globalData: {
  baseUrl: 'http://localhost:3000'  // 开发环境
  // baseUrl: 'https://api.yourdomain.com'  // 生产环境
}
```

## API 约定

所有接口统一返回格式：

```json
{
  "code": 0,
  "data": { ... },
  "message": "ok"
}
```

- `code: 0` 表示成功，非 0 表示失败
- `data` 为实际数据
- 请求封装在 `utils/request.js`，自动处理错误提示

## 接口对接

切换到真实后端时，只需：
1. 修改 `app.js` 中的 `baseUrl`
2. 在微信后台配置 request 合法域名
3. 如接口返回格式不同，调整 `utils/request.js` 中的解析逻辑

## 功能说明

| 页面 | 功能 |
|------|------|
| 首页 | 轮播图、分类导航、商品列表、下拉刷新、一键加购 |
| 商品详情 | 异步加载详情、商品参数、加购/立即购买 |
| 购物车 | 勾选/全选、数量增减、本地持久化、合计结算 |
| 个人中心 | 用户信息、订单状态、功能入口 |
