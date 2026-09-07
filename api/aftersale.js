// api/aftersale.js —— 售后工单
const http = require('./http.js')

module.exports = {
  apply(data) {
    // { orderId, type, reason, desc }
    return http.post('/aftersale/apply', data, { loadingText: '提交中...' })
  },
  getList(params) {
    return http.get('/aftersale/list', params || {}, { loading: false })
  },
  getDetail(id) {
    return http.get('/aftersale/detail', { id: id }, { loading: false })
  },
  cancel(id) {
    return http.post('/aftersale/cancel', { id: id }, { loading: false })
  },
  advance(id) {
    return http.post('/aftersale/advance', { id: id }, { loadingText: '同步处理状态...' })
  },
  rate(data) {
    return http.post('/aftersale/rate', data)
  }
}
