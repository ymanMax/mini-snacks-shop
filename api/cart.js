// api/cart.js —— 购物车
const http = require('./http.js')

module.exports = {
  getCart() {
    return http.get('/cart/list', {}, { loading: false })
  },
  add(data) {
    // data: { goodsId, count, specText, specPrice, pic }
    return http.post('/cart/add', data, { loading: false, showError: true })
  },
  update(data) {
    // data: { id, count?, checked? }
    return http.post('/cart/update', data, { loading: false })
  },
  toggleAll(checked) {
    return http.post('/cart/toggleAll', { checked: checked }, { loading: false })
  },
  remove(ids) {
    return http.post('/cart/delete', { ids: ids }, { loading: false })
  },
  clearInvalid() {
    return http.post('/cart/clearInvalid', {}, { loading: false })
  }
}
