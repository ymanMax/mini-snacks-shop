// api/member.js —— 会员 / 签到 / 积分
const http = require('./http.js')

module.exports = {
  getInfo() {
    return http.get('/member/info', {}, { loading: false })
  },
  getLevels() {
    return http.get('/member/levels', {}, { loading: false })
  },
  claimBirthdayGift() {
    return http.post('/member/birthday/gift', {})
  },
  getCheckinInfo() {
    return http.get('/checkin/info', {}, { loading: false })
  },
  doCheckin() {
    return http.post('/checkin/do', {})
  },
  getPoints(params) {
    return http.get('/points/list', params || {}, { loading: false })
  },
  getExchangeList() {
    return http.get('/points/exchange/list', {}, { loading: false })
  },
  exchange(id) {
    return http.post('/points/exchange', { id: id })
  }
}
