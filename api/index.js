// api/index.js —— 业务接口函数（页面统一从这里取数）
const { get, post, request, upload } = require('./http.js');

// ===== 首页 =====
const getBanners = () => get('/home/banners');
const getThemes = () => get('/home/themes');

// ===== 商品 =====
// params: { current, size, keywords, categoryId, sort, priceRange, origins, inStock, ids }
const getGoodsList = (params, op) => get('/goods/list', params, op);
const getGoodsDetail = (id, op) => get('/goods/detail', { id }, op);
const getRecommend = (goodsId, size = 6) => get('/goods/recommend', { goodsId, size });

// ===== 搜索 =====
const getHotWords = () => get('/search/hot');
const getSuggest = (keywords) => get('/search/suggest', { keywords });

// ===== 分类 =====
const getCategories = () => get('/category/list');

// ===== 购物车 =====
const getCartList = () => get('/cart/list');
// item: { goodsId, specText, price, count, pic, stock }
const addToCart = (item, op) => post('/cart/add', item, op);
const updateCartItem = (data) => post('/cart/update', data);
const checkAllCart = (checked) => post('/cart/checkAll', { checked });
const deleteCartItems = (ids) => post('/cart/delete', { ids });
const clearInvalidCart = () => post('/cart/clearInvalid');
const getCartCount = () => get('/cart/count');

// ===== 地址 =====
const getAddressList = () => get('/address/list');
const saveAddress = (data, op) => post('/address/save', data, op);
const deleteAddress = (id) => post('/address/delete', { id });
const setDefaultAddress = (id) => post('/address/default', { id });

// ===== 订单 =====
const getOrderList = (params, op) => get('/order/list', params, op); // { status, current, size } status:0全部 7待评价
const getOrderDetail = (id, op) => get('/order/detail', { id }, op);
const getOrderStatusCount = () => get('/order/statusCount');
// data: { items:[{goodsId,specText,price,count}], addressId, couponId, remark, deliveryDate, deliverySlot, payType, fromCart }
const previewOrder = (params, op) => get('/order/preview', params, op); // { items, addressId, couponId } → 金额试算
const createOrder = (data, op) => post('/order/create', data, op);
const payOrder = (id, op) => post('/order/pay', { id }, op);
const cancelOrder = (id) => post('/order/cancel', { id });
const confirmOrder = (id) => post('/order/confirm', { id });
const advanceOrder = (id) => post('/order/advance', { id }); // 模拟配送进度
const rebuyOrder = (id, op) => post('/order/rebuy', { id }, op);

// ===== 评价 =====
const getGoodsReviews = (params, op) => get('/review/goods', params, op); // { goodsId, current, size }
const getShopReviews = (params, op) => get('/review/shop', params, op);
// data: { orderId, goodsReviews:[{goodsId,score,tags,content,images}], shopScores:{fresh,speed,package}, shopContent }
const submitReview = (data, op) => post('/review/submit', data, op);

// ===== 会员 / 积分 / 签到 =====
const getMemberInfo = () => get('/member/info');
const getMemberLevels = () => get('/member/levels');
const claimBirthdayGift = (op) => post('/member/birthday', {}, op);
const getPointsInfo = () => get('/points/info');
const getPointsRecords = (params, op) => get('/points/records', params, op);
const getPointsMall = () => get('/points/mall');
const exchangePoints = (id, op) => post('/points/exchange', { id }, op);
const getCheckinInfo = () => get('/checkin/info');
const signCheckin = (op) => post('/checkin/sign', {}, op);

// ===== 优惠券 =====
const getCouponCenter = () => get('/coupon/center');
const claimCoupon = (id, op) => post('/coupon/claim', { id }, op);
const getMyCoupons = (status = 0) => get('/coupon/mine', { status });
const getUsableCoupons = (amount) => get('/coupon/usable', { amount });

// ===== 促销 / 拼团 =====
const getSeckill = () => get('/promotion/seckill');
const getSeckillSessions = () => get('/seckill/sessions');
const getFullReduce = () => get('/promotion/fullreduce');
const getGroupList = () => get('/group/list');
const getWholesale = () => get('/group/wholesale');
const getBestCoupon = (amount) => get('/coupon/best', { amount });
const getDeliveryRule = () => get('/shop/delivery');

// ===== 分享裂变 =====
const shareReward = (type) => post('/share/reward', { type }, { errorToast: false });
const shareInvite = (fromUserId) => post('/share/invite', { fromUserId }, { errorToast: false });

// ===== 客服 / 售后 =====
const getServiceFaq = () => get('/service/faq');
const askService = (content) => post('/service/ask', { content });
const rateService = (data, op) => post('/service/rate', data, op); // { speed, satisfaction, content }
const applyAftersale = (data, op) => post('/aftersale/apply', data, op); // { orderId, type, reason, description, images }
const getAftersaleList = (params, op) => get('/aftersale/list', params, op);
const getAftersaleDetail = (id) => get('/aftersale/detail', { id });
const getAftersaleByOrder = (orderId) => get('/aftersale/byOrder', { orderId });
const advanceAftersale = (id) => post('/aftersale/advance', { id });
const cancelAftersale = (id) => post('/aftersale/cancel', { id });

// ===== 拼团流程 =====
const getGroupDetail = (id, op) => get('/group/detail', { id }, op);
const getGroupByGoods = (goodsId) => get('/group/byGoods', { goodsId });
const getJoinableGroups = () => get('/group/joinable');
const getMyGroups = () => get('/group/mine');
const startGroup = (data, op) => post('/group/start', data, op); // { goodsId, specText, count } → { group, order }
const joinGroup = (data, op) => post('/group/join', data, op);   // { groupId, specText, count } → { group, order }

// ===== 消息 =====
const getMessages = (params, op) => get('/message/list', params, op);
const getUnreadCount = () => get('/message/unread');
const readMessage = (id) => post('/message/read', { id });
const readAllMessages = () => post('/message/readAll');

// ===== 店铺 / 用户 =====
const getShopInfo = () => get('/shop/info');
const getUserInfo = () => get('/user/info');
const updateUserInfo = (data) => post('/user/update', data);

// ===== 收藏 / 足迹 =====
const toggleCollect = (goodsId) => post('/collect/toggle', { goodsId });
const getCollectList = () => get('/collect/list');
const removeCollects = (goodsIds) => post('/collect/remove', { goodsIds });
const getFootprints = () => get('/footprint/list');
const clearFootprints = () => post('/footprint/clear');

module.exports = {
  request, upload,
  getBanners, getThemes,
  getGoodsList, getGoodsDetail, getRecommend,
  getHotWords, getSuggest,
  getCategories,
  getCartList, addToCart, updateCartItem, checkAllCart, deleteCartItems, clearInvalidCart, getCartCount,
  getAddressList, saveAddress, deleteAddress, setDefaultAddress,
  getOrderList, getOrderDetail, getOrderStatusCount, previewOrder, createOrder, payOrder, cancelOrder, confirmOrder, advanceOrder, rebuyOrder,
  getGoodsReviews, getShopReviews, submitReview,
  getMemberInfo, getMemberLevels, claimBirthdayGift,
  getPointsInfo, getPointsRecords, getPointsMall, exchangePoints,
  getCheckinInfo, signCheckin,
  getCouponCenter, claimCoupon, getMyCoupons, getUsableCoupons,
  getSeckill, getSeckillSessions, getFullReduce, getGroupList, getWholesale, getBestCoupon, getDeliveryRule,
  shareReward, shareInvite,
  getServiceFaq, askService, rateService,
  applyAftersale, getAftersaleList, getAftersaleDetail, getAftersaleByOrder, advanceAftersale, cancelAftersale,
  getGroupDetail, getGroupByGoods, getJoinableGroups, getMyGroups, startGroup, joinGroup,
  getMessages, getUnreadCount, readMessage, readAllMessages,
  getShopInfo, getUserInfo, updateUserInfo,
  toggleCollect, getCollectList, removeCollects, getFootprints, clearFootprints
};
