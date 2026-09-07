/**
 * 业务 API 统一出口
 * 所有页面只允许通过本文件（或 api/http.js）取数，禁止直接 import mock 文件、禁止硬编码 wx.request。
 * 分页参数约定：{ current, size, ... }，返回 data = { records, total, current, size }
 */
const http = require('./http.js');

const get = (url, data, opt) => http.get(url, data, opt);
const post = (url, data, opt) => http.post(url, data, opt);

module.exports = {
  http, // 兜底：特殊场景可直接 http.request

  /* 首页 / 商品 */
  home: {
    banners: () => get('/banner/list'),
    themes: () => get('/theme/list'),
    themeDetail: (id) => get('/theme/detail', { id })
  },
  category: {
    list: () => get('/category/list')
  },
  goods: {
    /**
     * 分页查询
     * @param {object} p { current, size, categoryId, keywords, sort: comprehensive|priceAsc|priceDesc|sales,
     *                     minPrice, maxPrice, origins: []|'a,b', inStock: true, themeId }
     */
    page: (p) => get('/goods/page', p),
    detail: (id) => get('/goods/detail', { id }),
    recommend: (id) => get('/goods/recommend', { id }),
    guess: () => get('/goods/guess')
  },

  /* 搜索 */
  search: {
    hot: () => get('/search/hot'),
    suggest: (keywords) => get('/search/suggest', { keywords }),
    history: () => get('/search/history'),
    addHistory: (keyword) => post('/search/history/add', { keyword }),
    deleteHistory: (keyword) => post('/search/history/delete', { keyword }),
    clearHistory: () => post('/search/history/clear')
  },

  /* 收藏 / 足迹 */
  collect: {
    toggle: (goodsId) => post('/collect/toggle', { goodsId }),
    page: (p) => get('/collect/page', p),
    footprintAdd: (goodsId) => post('/footprint/add', { goodsId }, { showError: false }),
    footprintList: () => get('/footprint/list'),
    footprintClear: () => post('/footprint/clear')
  },

  /* 购物车 */
  cart: {
    list: () => get('/cart/list'),
    count: () => get('/cart/count', {}, { showError: false }),
    add: (item) => post('/cart/add', item),
    update: (p) => post('/cart/update', p),
    checkAll: (checked) => post('/cart/checkAll', { checked }),
    remove: (ids) => post('/cart/delete', { ids }),
    clearInvalid: () => post('/cart/clearInvalid')
  },

  /* 收货地址 */
  address: {
    list: () => get('/address/list'),
    detail: (id) => get('/address/detail', { id }),
    default: () => get('/address/default'),
    save: (addr) => post('/address/save', addr),
    remove: (id) => post('/address/delete', { id }),
    setDefault: (id) => post('/address/setDefault', { id }),
    mapPois: () => get('/address/mapPois') // 地图选点 mock POI 列表 { pois, maxKm }
  },

  /* 订单 */
  order: {
    /** p: { fromCart:true } 或 { items:[...], addressId, couponId, remark, deliveryDate, deliverySlot, payType } */
    preview: (p) => post('/order/preview', p),
    create: (p) => post('/order/create', p),
    /** status: 0全部/1待付款/2待发货/3配送中/4待收货/5已完成/6已取消/7待评价 */
    page: (p) => get('/order/page', p),
    detail: (id) => get('/order/detail', { id }),
    statusCount: () => get('/order/statusCount', {}, { showError: false }),
    pay: (id) => post('/order/pay', { id }),
    cancel: (id) => post('/order/cancel', { id }),
    confirm: (id) => post('/order/confirm', { id }),
    advance: (id) => post('/order/advance', { id }), // 模拟配送进度推进（演示）
    rebuy: (id) => post('/order/rebuy', { id })
  },

  /* 评价 */
  review: {
    goodsSummary: (goodsId) => get('/review/goods/summary', { goodsId }),
    goodsPage: (p) => get('/review/goods/page', p),
    submitGoods: (p) => post('/review/goods/submit', p),
    shopPage: (p) => get('/review/shop/page', p),
    submitShop: (p) => post('/review/shop/submit', p)
  },

  /* 用户 / 会员 */
  user: {
    info: () => get('/user/info'),
    login: () => post('/user/login'),
    logout: () => post('/user/logout'),
    updateAvatar: (avatar) => post('/user/updateAvatar', { avatar })
  },
  member: {
    info: () => get('/member/info'),
    levels: () => get('/member/levels'),
    receiveBirthday: () => post('/member/birthday/receive')
  },

  /* 签到 / 积分 */
  checkin: {
    info: () => get('/checkin/info'),
    sign: () => post('/checkin/sign')
  },
  points: {
    page: (p) => get('/points/page', p),
    exchangeList: () => get('/points/exchange'),
    exchange: (id) => post('/points/exchange/do', { id })
  },

  /* 优惠券 */
  coupon: {
    available: () => get('/coupon/available'),
    mine: (status) => get('/coupon/mine', { status }),
    usable: (amount) => get('/coupon/usable', { amount }),
    best: (amount) => get('/coupon/best', { amount }), // 自动最优券（减免最大）
    receive: (id) => post('/coupon/receive', { id })
  },

  /* 促销 / 拼团 */
  promotion: {
    current: () => get('/promotion/current'),
    remind: (id) => post('/promotion/remind', { id }) // 秒杀开场提醒（写入消息）
  },
  group: {
    list: () => get('/group/list'),
    detail: (id) => get('/group/detail', { id }),
    mine: () => get('/group/mine'),
    /** 开团：{goodsId, specText?, count?} → {group, order} */
    create: (p) => post('/group/create', p),
    /** 参团：{id, specText?, count?} → {group, order, msg} */
    join: (p) => post('/group/join', typeof p === 'object' ? p : { id: p })
  },

  /* 分享裂变 */
  share: {
    /** 分享商品/拼团得积分（5分/次，3次/天）：type 'goods'|'group' */
    reward: (type, relatedId) => post('/share/reward', { type, relatedId }, { showError: false }),
    /** 邀请新用户得优惠券（1次/天） */
    invite: () => post('/invite/reward')
  },

  /* 客服与售后 */
  service: {
    start: () => get('/service/start'), // { welcome, hotQuestions }
    reply: (question) => post('/service/reply', { question }, { showError: false }), // 规则引擎自动回复
    rate: (p) => post('/service/rate', p) // { speed, solve, content }
  },
  aftersale: {
    reasons: () => get('/aftersale/reasons'), // { reasons:{1:[],2:[],3:[]}, typeText, statusText }
    /** { orderId, type(1仅退款/2退货退款/3换货), reason, desc, images[] } */
    apply: (p) => post('/aftersale/apply', p),
    page: (p) => get('/aftersale/page', p), // status: 0全部/1待审核/2处理中/3已完成/4已拒绝/5已撤销
    detail: (id) => get('/aftersale/detail', { id }),
    advance: (id) => post('/aftersale/advance', { id }), // 演示推进：待审核→处理中→已完成
    cancel: (id) => post('/aftersale/cancel', { id })
  },

  /* 消息 */
  message: {
    list: (type) => get('/message/list', { type }),
    unread: () => get('/message/unread', {}, { showError: false }),
    read: (id) => post('/message/read', { id }),
    readAll: () => post('/message/readAll')
  },

  /* 店铺 */
  shop: {
    info: () => get('/shop/info'),
    freight: (p) => get('/shop/freight', p)
  },

  /* 调试：重置全部 mock 数据 */
  debug: {
    reset: () => post('/debug/reset')
  }
};
