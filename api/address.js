// api/address.js —— 收货地址
const http = require('./http.js')

module.exports = {
  getList(tag) {
    return http.get('/address/list', tag ? { tag: tag } : {}, { loading: false })
  },
  save(data) {
    return http.post('/address/save', data)
  },
  remove(id) {
    return http.post('/address/delete', { id: id }, { loading: false })
  },
  setDefault(id) {
    return http.post('/address/setDefault', { id: id }, { loading: false })
  },
  getPois(keyword) {
    return http.get('/address/pois', keyword ? { keyword: keyword } : {}, { loading: false })
  },
  locate() {
    return http.get('/address/locate', {}, { loadingText: '定位中...' })
  }
}
