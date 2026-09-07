// api/coupon.js —— 优惠券
const http = require('./http.js')

module.exports = {
  getTemplates() {
    return http.get('/coupon/templates', {}, { loading: false })
  },
  getMine(status) {
    return http.get('/coupon/mine', status ? { status: status } : {}, { loading: false })
  },
  receive(templateId) {
    return http.post('/coupon/receive', { templateId: templateId })
  }
}
