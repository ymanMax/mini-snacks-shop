// pages/list/list.js —— 主题商品列表
const homeApi = require('../../api/home.js')
const { quickAdd } = require('../../utils/cart.js')

Page({
  data: {
    theme: null,
    goods: [],
    loading: true
  },

  onLoad(options) {
    const id = options.item || options.id || 1
    homeApi.getThemeDetail(id).then((theme) => {
      wx.setNavigationBarTitle({ title: theme.name })
      this.setData({ theme: theme, goods: theme.goods, loading: false })
    }).catch(() => this.setData({ loading: false }))
  },

  onPullDownRefresh() {
    if (!this.data.theme) return
    homeApi.getThemeDetail(this.data.theme.id).then((theme) => {
      this.setData({ theme: theme, goods: theme.goods })
      wx.stopPullDownRefresh()
    })
  },

  onAdd(e) {
    quickAdd(e.detail.item)
  }
})
