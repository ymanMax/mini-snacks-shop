// api/search.js —— 搜索
const http = require('./http.js')

module.exports = {
  getHot() {
    return http.get('/search/hot', {}, { loading: false })
  },
  suggest(keywords) {
    return http.get('/search/suggest', { keywords: keywords }, { loading: false })
  },
  // 结果搜索直接复用商品列表接口
  search(params) {
    return http.get('/goods/list', params || {}, { loading: false })
  }
}
