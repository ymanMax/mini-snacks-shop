// api/order.js —— 订单全链路
const http = require('./http.js')

module.exports = {
  getList(params) {
    // { status, current, size }
    return http.get('/order/list', params || {}, { loading: false })
  },
  getCounts() {
    return http.get('/order/counts', {}, { loading: false })
  },
  getDetail(id) {
    return http.get('/order/detail', { id: id })
  },
  preview(data) {
    // { items, addressId, couponInstanceId }
    return http.post('/order/preview', data, { loading: false })
  },
  create(data) {
    return http.post('/order/create', data)
  },
  pay(id) {
    return http.post('/order/pay', { id: id }, { loadingText: '支付中...' })
  },
  cancel(id) {
    return http.post('/order/cancel', { id: id }, { loading: false })
  },
  advance(id) {
    // 演示：模拟配送进度推进
    return http.post('/order/advance', { id: id }, { loadingText: '同步配送状态...' })
  },
  confirm(id) {
    return http.post('/order/confirm', { id: id })
  },
  reorder(id) {
    return http.post('/order/reorder', { id: id })
  }
}
