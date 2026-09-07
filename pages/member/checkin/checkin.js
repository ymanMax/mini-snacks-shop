// pages/member/checkin/checkin.js —— 每日签到
const memberApi = require('../../../api/member.js')

Page({
  data: {
    info: null,
    cells: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    points: 0,
    pop: false,
    popPoints: 0
  },

  onShow() {
    this.load()
  },

  load() {
    Promise.all([memberApi.getCheckinInfo(), memberApi.getInfo()]).then((res) => {
      const info = res[0]
      const cells = []
      for (let i = 0; i < info.firstWeek; i++) cells.push({ blank: true, key: 'b' + i })
      for (let d = 1; d <= info.daysInMonth; d++) {
        cells.push({
          blank: false,
          key: 'd' + d,
          day: d,
          signed: info.state.records.indexOf(d) > -1,
          isToday: d === info.today
        })
      }
      // 7 天奖励条状态
      const cd = info.state.continuousDays
      const reach = info.state.todaySigned ? ((cd - 1) % 7) + 1 : (cd % 7)
      const next = info.state.todaySigned ? ((cd % 7) + 1) : ((cd % 7) + 1)
      info.rule.rewards = info.rule.rewards.map((rw) => {
        return Object.assign({}, rw, {
          state: rw.day <= reach ? 'done' : (rw.day === next ? 'current' : 'wait')
        })
      })
      this.setData({
        info: info,
        cells: cells,
        points: res[1].user.points
      })
    })
  },

  doSign() {
    if (this.data.info.state.todaySigned) return
    memberApi.doCheckin().then((r) => {
      // 积分动画
      this.setData({ pop: true, popPoints: r.points })
      setTimeout(() => this.setData({ pop: false }), 1600)
      this.load()
    }).catch((err) => {
      wx.showToast({ title: (err && err.msg) || '签到失败', icon: 'none' })
    })
  }
})
