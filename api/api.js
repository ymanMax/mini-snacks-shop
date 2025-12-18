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
  payment
};

