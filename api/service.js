// api/service.js —— 客服
const http = require('./http.js')

module.exports = {
  history() {
    return http.get('/service/history', {}, { loading: false })
  },
  send(text) {
    return http.post('/service/send', { text: text }, { loading: false })
  },
  rate(data) {
    return http.post('/service/rate', data, { loading: false })
  }
}
