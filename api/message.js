// api/message.js —— 消息通知
const http = require('./http.js')

module.exports = {
  getList(params) {
    return http.get('/message/list', params || {}, { loading: false })
  },
  getUnreadCount() {
    return http.get('/message/unreadCount', {}, { loading: false })
  },
  read(id) {
    return http.post('/message/read', { id: id }, { loading: false })
  },
  readAll(type) {
    return http.post('/message/readAll', type ? { type: type } : {}, { loading: false })
  }
}
