// api/index.js —— 全站接口定义（页面只允许通过本模块取数）
const http = require('./http.js');

// ===== 首页 =====
const homeApi = {
  getBanners: () => http.get('/home/banners'),
  getQuickEntries: () => http.get('/home/quick'),
  getThemes: () => http.get('/themes'),
  getTheme: (id) => http.get('/themes/' + id)
};

// ===== 分类 / 商品 =====
const categoryApi = {
  getCategories: () => http.get('/categories')
};

const goodsApi = {
  // params: { current, size, keywords, categoryId, sort, minPrice, maxPrice, origins, inStock, hot, themeId }
  getPage: (params) => http.get('/goods/page', params),
  getDetail: (id) => http.get('/goods/' + id),
  getRecommend: (id) => http.get('/goods/' + id + '/recommend'),
  getHotKeywords: () => http.get('/search/hot'),
  getSuggest: (keywords) => http.get('/search/suggest', { keywords })
};

// ===== 购物车 =====
const cartApi = {
  getCart: () => http.get('/cart'),
  add: (data) => http.post('/cart/add', data, { silent: true }),
  update: (data) => http.post('/cart/update', data, { silent: true }),
  toggleAll: (checked) => http.post('/cart/toggle-all', { checked }, { silent: true }),
  remove: (ids) => http.post('/cart/delete', { ids }, { silent: true }),
  clearInvalid: () => http.post('/cart/clear-invalid', {}, { silent: true }),
  reorder: (items) => http.post('/cart/reorder', { items }, { silent: true })
};

// ===== 地址 =====
const addressApi = {
  list: () => http.get('/addresses'),
  save: (data) => http.post('/addresses', data, { silent: true }),
  remove: (id) => http.post('/addresses/delete', { id }, { silent: true }),
  setDefault: (id) => http.post('/addresses/default', { id }, { silent: true })
};

// ===== 订单 =====
const orderApi = {
  preview: (data) => http.post('/orders/preview', data, { silent: true }),
  create: (data) => http.post('/orders', data, { loading: true }),
  getPage: (params) => http.get('/orders/page', params),
  getCounts: () => http.get('/orders/counts', {}, { silent: true }),
  getDetail: (id) => http.get('/orders/' + id),
  pay: (id) => http.post('/orders/' + id + '/pay', {}, { loading: true, loadingText: '支付中...' }),
  cancel: (id) => http.post('/orders/' + id + '/cancel'),
  receive: (id) => http.post('/orders/' + id + '/receive'),
  advance: (id) => http.post('/orders/' + id + '/advance'),
  reorder: (id) => http.post('/orders/' + id + '/reorder', {}, { silent: true }),
  review: (id, data) => http.post('/orders/' + id + '/review', data, { loading: true, loadingText: '提交中...' })
};

// ===== 评价 =====
const reviewApi = {
  getGoodsReviews: (goodsId, params) => http.get('/reviews/goods/' + goodsId + '/page', params),
  getShopReviews: (params) => http.get('/reviews/shop/page', params),
};

// ===== 会员 / 用户 =====
const memberApi = {
  getInfo: () => http.get('/member/info', {}, { silent: true }),
  updateUser: (data) => http.put('/user', data, { silent: true }),
  logout: () => http.post('/user/logout', {}, { silent: true }),
  birthdayGift: () => http.post('/member/birthday-gift', {}, { loading: true })
};

// ===== 积分 =====
const pointsApi = {
  getRecords: (params) => http.get('/points/records/page', params, { silent: true }),
  getExchangeItems: () => http.get('/points/exchange'),
  exchange: (id) => http.post('/points/exchange', { id }, { loading: true })
};

// ===== 签到 =====
const checkinApi = {
  getInfo: () => http.get('/checkin', {}, { silent: true }),
  sign: () => http.post('/checkin', {}, { loading: true, loadingText: '签到中...' })
};

// ===== 优惠券 =====
const couponApi = {
  getTemplates: () => http.get('/coupons/templates', {}, { silent: true }),
  receive: (id) => http.post('/coupons/receive', { id }, { loading: false }),
  getMine: (status) => http.get('/coupons/mine', { status: status || '' }, { silent: true }),
  getUsable: (amount) => http.get('/coupons/usable', { amount }, { silent: true })
};

// ===== 促销 / 拼团 =====
const promotionApi = {
  getAll: () => http.get('/promotions', {}, { silent: true }),
  seckillBuy: (data) => http.post('/promotions/seckill/buy', data, { silent: true }),
  wholesaleBuy: (data) => http.post('/promotions/wholesale/buy', data, { silent: true })
};

const groupApi = {
  getList: () => http.get('/groups', {}, { silent: true }),
  getMine: () => http.get('/groups/mine', {}, { silent: true }),
  getDetail: (id) => http.get('/groups/' + id, {}, { silent: true }),
  open: (data) => http.post('/groups/open', data, { loading: true, loadingText: '开团中...' }),
  join: (id, data) => http.post('/groups/' + id + '/join', data || {}, { loading: true }),
  simulate: (id, data) => http.post('/groups/' + id + '/simulate', data || {}, { silent: true }),
  shareReward: (type) => http.post('/share/reward', { type: type || 'goods' }, { silent: true })
};

const inviteApi = {
  reward: () => http.post('/invite/reward', {}, { loading: true })
};

const afterSaleApi = {
  getPage: (params) => http.get('/aftersales/page', params, { silent: true }),
  getDetail: (id) => http.get('/aftersales/' + id, {}, { silent: true }),
  apply: (data) => http.post('/aftersales', data, { loading: true, loadingText: '提交中...' }),
  advance: (id) => http.post('/aftersales/' + id + '/advance', {}, { silent: true }),
  cancel: (id) => http.post('/aftersales/' + id + '/cancel', {}, { silent: true }),
  rate: (id, data) => http.post('/aftersales/' + id + '/rate', data, { loading: true })
};

// ===== 消息 =====
const messageApi = {
  getList: (type) => http.get('/messages', { type: type || 0 }, { silent: true }),
  read: (id) => http.post('/messages/read', { id: id || '' }, { silent: true })
};

const serviceApi = {
  rate: (data) => http.post('/service/rate', data, { silent: true })
};

// ===== 店铺 =====
const shopApi = {
  getInfo: () => http.get('/shop/info', {}, { silent: true }),
  getReviews: (params) => reviewApi.getShopReviews(params)
};

// ===== 收藏 / 足迹 =====
const collectApi = {
  getPage: (params) => http.get('/collects/page', params, { silent: true }),
  toggle: (goodsId) => http.post('/collects/toggle', { goodsId }, { silent: true })
};

const footprintApi = {
  getPage: () => http.get('/footprints/page', {}, { silent: true }),
  add: (goodsId) => http.post('/footprints/add', { goodsId }, { silent: true }),
  clear: () => http.post('/footprints/clear', {}, { silent: true })
};

module.exports = {
  http,
  homeApi,
  categoryApi,
  goodsApi,
  cartApi,
  addressApi,
  orderApi,
  reviewApi,
  memberApi,
  pointsApi,
  checkinApi,
  couponApi,
  promotionApi,
  groupApi,
  inviteApi,
  afterSaleApi,
  messageApi,
  serviceApi,
  shopApi,
  collectApi,
  footprintApi
};
