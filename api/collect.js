// api/collect.js —— 收藏与足迹
const http = require('./http.js')

module.exports = {
  getCollectList() {
    return http.get('/collect/list', {}, { loading: false })
  },
  toggleCollect(goodsId) {
    return http.post('/collect/toggle', { goodsId: goodsId }, { loading: false })
  },
  addFootprint(goodsId) {
    return http.post('/footprint/add', { goodsId: goodsId }, { loading: false })
  },
  getFootprint() {
    return http.get('/footprint/list', {}, { loading: false })
  },
  clearFootprint() {
    return http.post('/footprint/clear', {}, { loading: false })
  }
}
