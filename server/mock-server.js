/**
 * Mock API 服务器 - 用于本地开发测试
 *
 * 启动方式：
 *   1. 确保已安装 Node.js
 *   2. cd server
 *   3. node mock-server.js
 *   4. 服务器运行在 http://localhost:3000
 *
 * 微信开发者工具设置：
 *   详情 → 本地设置 → 勾选「不校验合法域名」
 */

const http = require('http')

const PORT = 3000

// ===== Mock 数据 =====

const banners = [
  { id: 1, imageUrl: 'https://picsum.photos/750/300?random=1', link: '' },
  { id: 2, imageUrl: 'https://picsum.photos/750/300?random=2', link: '' },
  { id: 3, imageUrl: 'https://picsum.photos/750/300?random=3', link: '' }
]

const categories = [
  { id: 1, name: '数码', icon: '📱' },
  { id: 2, name: '服饰', icon: '👕' },
  { id: 3, name: '美食', icon: '🍔' },
  { id: 4, name: '家居', icon: '🏠' },
  { id: 5, name: '美妆', icon: '💄' },
  { id: 6, name: '运动', icon: '⚽' },
  { id: 7, name: '图书', icon: '📚' },
  { id: 8, name: '更多', icon: '✨' }
]

const goodsList = [
  { id: 1, name: '无线蓝牙耳机', price: 129.00, oldPrice: 199.00, img: '🎧', desc: '降噪蓝牙耳机，长续航，佩戴舒适', categoryId: 1, stock: 100, sales: 3200, params: [{ label: '品牌', value: 'XX科技' }, { label: '续航', value: '30小时' }, { label: '蓝牙版本', value: '5.3' }] },
  { id: 2, name: '智能手表', price: 299.00, oldPrice: 399.00, img: '⌚', desc: '心率监测，运动追踪，超长待机', categoryId: 1, stock: 50, sales: 1800, params: [{ label: '品牌', value: 'XX科技' }, { label: '屏幕', value: '1.4寸 AMOLED' }, { label: '续航', value: '14天' }] },
  { id: 3, name: '便携充电宝', price: 69.00, oldPrice: 99.00, img: '🔋', desc: '20000mAh大容量，双向快充', categoryId: 1, stock: 200, sales: 5600, params: [{ label: '容量', value: '20000mAh' }, { label: '输出', value: '22.5W快充' }, { label: '重量', value: '350g' }] },
  { id: 4, name: '机械键盘', price: 159.00, oldPrice: 219.00, img: '⌨️', desc: '青轴机械手感，RGB背光', categoryId: 1, stock: 80, sales: 2400, params: [{ label: '轴体', value: '青轴' }, { label: '背光', value: 'RGB' }, { label: '键位', value: '104键' }] },
  { id: 5, name: '高清摄像头', price: 189.00, oldPrice: 259.00, img: '📷', desc: '4K高清直播，自动对焦', categoryId: 1, stock: 60, sales: 900, params: [{ label: '分辨率', value: '4K' }, { label: '帧率', value: '60fps' }, { label: '对焦', value: '自动' }] },
  { id: 6, name: '手机支架', price: 25.00, oldPrice: 39.00, img: '📱', desc: '桌面折叠支架，多角度调节', categoryId: 1, stock: 300, sales: 8200, params: [{ label: '材质', value: '铝合金' }, { label: '折叠', value: '支持' }, { label: '调节角度', value: '270度' }] }
]

// 内存中的用户数据（模拟数据库）
const userStore = {}

// ===== 工具函数 =====

/**
 * 读取 POST 请求 body
 */
function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch (e) {
        resolve({})
      }
    })
  })
}

function sendJson(res, data, code = 0) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })
  res.end(JSON.stringify({ code: code, data: data, message: 'ok' }))
}

// ===== 路由处理 =====

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname
  const params = url.searchParams

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    res.end()
    return
  }

  // -- 商品相关 --

  if (path === '/api/banners' && req.method === 'GET') {
    sendJson(res, banners)
    return
  }

  if (path === '/api/categories' && req.method === 'GET') {
    sendJson(res, categories)
    return
  }

  if (path === '/api/goods' && req.method === 'GET') {
    const categoryId = params.get('categoryId')
    let result = goodsList
    if (categoryId) {
      result = goodsList.filter(g => g.categoryId === Number(categoryId))
    }
    sendJson(res, result)
    return
  }

  // 商品详情 /api/goods/:id
  const detailMatch = path.match(/^\/api\/goods\/(\d+)$/)
  if (detailMatch && req.method === 'GET') {
    const id = Number(detailMatch[1])
    const goods = goodsList.find(g => g.id === id)
    if (goods) {
      sendJson(res, goods)
    } else {
      sendJson(res, null, 1)
    }
    return
  }

  // -- 用户相关 --

  // 微信登录：code 换 token + 用户信息
  // POST /api/user/login  { code: "xxx" }
  if (path === '/api/user/login' && req.method === 'POST') {
    const body = await readBody(req)
    const code = body.code || ''
    console.log('[Mock] 收到登录请求, code:', code ? code.substring(0, 10) + '...' : '空')

    // 生成模拟 token（生产环境由后端调用微信 code2Session 获取 openid 后签发）
    const token = 'mock_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)

    // 如果该 openid 之前注册过，返回已有用户信息
    // 这里用 code 前 8 位做简单映射模拟
    const mockOpenId = 'mock_oid_' + (code.substring(0, 8) || 'unknown')
    let userInfo = userStore[mockOpenId] || null

    sendJson(res, {
      token: token,
      userInfo: userInfo,  // 首次登录为 null，注册后返回已存信息
      openid: mockOpenId   // 仅供 mock 调试，生产环境不要返回给前端
    })
    return
  }

  // 注册 / 更新用户信息
  // POST /api/user/register  { nickName, avatarUrl }
  if (path === '/api/user/register' && req.method === 'POST') {
    const body = await readBody(req)
    console.log('[Mock] 收到注册请求:', JSON.stringify(body))

    // 从 Authorization header 提取 token（简化处理）
    const authHeader = req.headers['authorization'] || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      sendJson(res, null, 401)
      return
    }

    // 模拟：用 token 后 6 位做 key（生产环境通过 token 查到 openid）
    const mockOpenId = 'mock_oid_' + (token.slice(-6) || 'fallback')

    const userInfo = {
      openid: mockOpenId,
      nickName: body.nickName || '微信用户',
      avatarUrl: body.avatarUrl || ''
    }

    // 保存到内存
    userStore[mockOpenId] = userInfo

    sendJson(res, { userInfo })
    return
  }

  // 获取用户信息
  // GET /api/user/info  需要 Authorization header
  if (path === '/api/user/info' && req.method === 'GET') {
    const authHeader = req.headers['authorization'] || ''
    const token = authHeader.replace('Bearer ', '')

    if (!token) {
      sendJson(res, null, 401)
      return
    }

    const mockOpenId = 'mock_oid_' + (token.slice(-6) || 'fallback')
    const userInfo = userStore[mockOpenId] || {
      nickName: '微信用户',
      avatarUrl: 'https://picsum.photos/100/100?random=99'
    }

    sendJson(res, {
      ...userInfo,
      phone: '138****8888'
    })
    return
  }

  // -- 订单相关 --

  // 订单提交
  if (path === '/api/order/submit' && req.method === 'POST') {
    sendJson(res, { orderId: 'ORD' + Date.now(), status: 'pending' })
    return
  }

  // 404
  sendJson(res, null, 404)
}

// ===== 启动服务器 =====

const server = http.createServer(handleRequest)

server.listen(PORT, () => {
  console.log('========================================')
  console.log('  Mock API 服务器已启动')
  console.log('  地址: http://localhost:' + PORT)
  console.log('  ')
  console.log('  可用接口:')
  console.log('    GET  /api/banners          - 轮播图')
  console.log('    GET  /api/categories       - 分类列表')
  console.log('    GET  /api/goods            - 商品列表')
  console.log('    GET  /api/goods/:id        - 商品详情')
  console.log('    POST /api/user/login       - 微信登录')
  console.log('    POST /api/user/register    - 注册用户信息')
  console.log('    GET  /api/user/info        - 获取用户信息')
  console.log('    POST /api/order/submit     - 提交订单')
  console.log('  ')
  console.log('  按 Ctrl+C 停止')
  console.log('========================================')
})
