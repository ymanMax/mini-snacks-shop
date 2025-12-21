const request = require("../utils/request.js")

// 获取队伍信息
// 0-GET
// 1-POST
// 2-PUT
// 3-DELETE

function getBanner() {
  return request('/banner/1', {}, {
    prompt: false
  }, 0, 0);
}

function getThemeInfo(theme_id) {
  return request('/theme/' + theme_id, {
    ids: theme_id
  }, {
    prompt: false
  }, 0, 0);
}

function getItems() {
  return request('/product/recent', {}, {
    prompt: false
  }, 0, 0);
}

function getDetail(id) {
  return request('/product/' + id, {}, {
    prompt: false
  }, 0, 0);
}

function getClass() {
  return request('/category/all', {}, {
    prompt: false
  }, 0, 0);
}

function getClassDetail(class_id) {
  return request('/product/by_category', {
    id : class_id
  }, {
    prompt: false
  }, 0, 0);
}

function setOrder(products) {
  return request('/order', {
    products : products,
  }, {
    prompt: false
  }, 1, 1);
}

function verify(token) {
  return request('/token/verify', {
    token: token
  }, {
    prompt: false
  }, 1, 1);
}

function getOrderDetail(order_id) {
  return request('/order/' + order_id, {}, {
    prompt: false
  }, 0, 0);
}

function getAllOrders(data) {
  return request('/order/by_user', {data:data}, {
    prompt: false
  }, 0, 1);
}

function payment(id) {
  return request('/pay/pre_orde', {id:id}, {
    prompt: false
  }, 1, 1);
}

// 获取用户积分信息
function getUserPoints() {
  return request('/user/points', {}, {
    prompt: false
  }, 0, 0);
}

// 获取积分记录
function getPointsRecords() {
  return request('/user/points/records', {}, {
    prompt: false
  }, 0, 0);
}

// 获取积分兑换商品
function getPointsExchangeProducts() {
  return request('/points/exchange/products', {}, {
    prompt: false
  }, 0, 0);
}

// 积分兑换商品
function exchangePoints(product_id) {
  return request('/points/exchange', { product_id: product_id }, {
    prompt: false
  }, 1, 1);
}

// 使用积分抵扣
function usePointsDeduction(order_id, points) {
  return request('/points/deduction', { order_id: order_id, points: points }, {
    prompt: false
  }, 1, 1);
}

// 评价商品获得积分
function earnPointsByReview(product_id, review) {
  return request('/points/earn/review', { product_id: product_id, review: review }, {
    prompt: false
  }, 1, 1);
}

module.exports = {
  getBanner,
  getThemeInfo,
  getItems,
  getDetail,
  getClass,
  getClassDetail,
  setOrder,
  verify,
  getOrderDetail,
  getAllOrders,
  payment,
  getUserPoints,
  getPointsRecords,
  getPointsExchangeProducts,
  exchangePoints,
  usePointsDeduction,
  earnPointsByReview
};

