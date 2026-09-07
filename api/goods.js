// api/goods.js —— 商品
const http = require('./http.js')

module.exports = {
  // params: { current, size, categoryId, sort, minPrice, maxPrice, origins, onlyStock, keywords, themeId }
  getList(params) {
    return http.get('/goods/list', params || {}, { loading: false })
  },
  getFilterMeta(categoryId) {
    return http.get('/goods/filterMeta', { categoryId: categoryId }, { loading: false })
  },
  getRecent(params) {
    return http.get('/goods/recent', params || {}, { loading: false })
  },
  getHot(limit, excludeId) {
    return http.get('/goods/hot', { limit: limit || 8, excludeId: excludeId }, { loading: false })
  },
  getDetail(id) {
    return http.get('/goods/detail', { id: id }, { loading: false })
  },
  getRecommend(goodsId, limit) {
    return http.get('/goods/recommend', { goodsId: goodsId, limit: limit || 6 }, { loading: false })
  }
}
