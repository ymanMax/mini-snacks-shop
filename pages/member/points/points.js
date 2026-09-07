// pages/member/points/points.js —— 积分中心
const memberApi = require('../../../api/member.js')
const toast = require('../../../utils/toast.js')
const { POINT_TYPE } = require('../../../utils/constant.js')

Page({
  data: {
    balance: 0,
    records: [],
    rules: [],
    exchange: [],
    tabs: [
      { key: 0, label: '全部' },
      { key: 1, label: '收入' },
      { key: 2, label: '支出' }
    ],
    activeTab: 0
  },

  onShow() {
    this.load()
  },

  load() {
    const type = this.data.activeTab === 0 ? '' : this.data.activeTab
    Promise.all([
      memberApi.getPoints({ type: type, current: 1, size: 50 }),
      memberApi.getExchangeList()
    ]).then((res) => {
      const records = res[0].page.records.map((r) => Object.assign({}, r, {
        typeText: POINT_TYPE[r.type] || '其他',
        positive: r.points > 0
      }))
      this.setData({
        balance: res[0].balance,
        records: records,
        rules: res[0].rules,
        exchange: res[1]
      })
    })
  },

  switchTab(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.key) })
    this.load()
  },

  exchange(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.exchange.find((x) => x.id === id)
    if (!item) return
    if (this.data.balance < item.points) {
      toast.showToast('积分不足，快去签到/购物赚积分吧')
      return
    }
    toast.confirm('确认消耗 ' + item.points + ' 积分兑换「' + item.name + '」吗？', '积分兑换').then((ok) => {
      if (!ok) return
      memberApi.exchange(id).then(() => {
        toast.success('兑换成功，可在卡包/站内查看')
        this.load()
      }).catch((err) => toast.showToast((err && err.msg) || '兑换失败'))
    })
  }
})
