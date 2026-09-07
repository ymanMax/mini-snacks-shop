// api/shop.js —— 店铺与评价
const http = require('./http.js')

module.exports = {
  getInfo() {
    return http.get('/shop/info', {}, { loading: false })
  },
  getShopReviews(params) {
    return http.get('/review/shop', params || {}, { loading: false })
  },
  getGoodsReviews(params) {
    return http.get('/review/goods', params || {}, { loading: false })
  },
  getReviewSummary(goodsId) {
    return http.get('/review/summary', { goodsId: goodsId }, { loading: false })
  },
  submitReview(data) {
    return http.post('/review/submit', data)
  }
}
