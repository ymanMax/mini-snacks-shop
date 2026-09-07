// pages/newAddress/newAddress.js —— 新建/编辑收货地址
const addressApi = require('../../api/address.js')
const toast = require('../../utils/toast.js')

const DISTANCES = ['1km以内', '3km以内', '5km', '8km', '12km以上']
const DISTANCE_VALUES = [0.8, 2, 4, 8, 12]
const TAGS = ['家', '学校', '公司', '无']

Page({
  data: {
    id: null,
    from: '',
    name: '',
    phone: '',
    region: [],
    regionText: '请选择省/市/区',
    detail: '',
    tags: TAGS,
    tagIndex: 3,
    isDefault: false,
    distances: DISTANCES,
    distanceIndex: 1,
    poiName: ''
  },

  onLoad(options) {
    this.setData({ from: options.from || '' })
    const poi = wx.getStorageSync('selectedPoi')
    if (poi) {
      wx.removeStorageSync('selectedPoi')
      let di = 1
      DISTANCE_VALUES.forEach(function (v, i) {
        if (Math.abs(v - poi.distanceKm) < Math.abs(DISTANCE_VALUES[di] - poi.distanceKm)) di = i
      })
      this.setData({
        region: [poi.province, poi.city, poi.district],
        regionText: poi.province + ' ' + poi.city + ' ' + poi.district,
        detail: poi.detail || poi.name,
        distanceIndex: di,
        poiName: poi.name
      })
    }
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑收货地址' })
      addressApi.getList().then((list) => {
        const a = list.find((x) => x.id == options.id)
        if (!a) return
        let di = DISTANCE_VALUES.findIndex((d) => d === a.distanceKm)
        if (di < 0) di = 1
        let ti = TAGS.indexOf(a.tag)
        if (ti < 0) ti = 3
        this.setData({
          id: a.id,
          name: a.name,
          phone: a.phone,
          region: [a.province, a.city, a.district],
          regionText: a.province + ' ' + a.city + ' ' + a.district,
          detail: a.detail,
          tagIndex: ti,
          isDefault: !!a.isDefault,
          distanceIndex: di
        })
      })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  onRegion(e) {
    this.setData({
      region: e.detail.value,
      regionText: e.detail.value.join(' ')
    })
  },

  goMapPick() {
    wx.navigateTo({ url: '/pages/address/pick/pick' })
  },

  pickTag(e) {
    this.setData({ tagIndex: Number(e.currentTarget.dataset.index) })
  },

  onDistance(e) {
    this.setData({ distanceIndex: Number(e.detail.value) })
  },

  onDefault(e) {
    this.setData({ isDefault: e.detail.value })
  },

  save() {
    const d = this.data
    if (!d.name.trim()) return toast.showToast('请填写收货人姓名')
    if (!/^1\d{10}$/.test(d.phone.trim()) && !/\d{3}\*{4}\d{4}/.test(d.phone.trim())) {
      return toast.showToast('请填写正确的 11 位手机号')
    }
    if (!d.region.length) return toast.showToast('请选择所在地区')
    if (!d.detail.trim()) return toast.showToast('请填写详细地址')
    const tag = d.tagIndex === 3 ? '' : d.tags[d.tagIndex]
    const payload = {
      id: d.id,
      name: d.name.trim(),
      phone: d.phone.trim(),
      province: d.region[0],
      city: d.region[1],
      district: d.region[2],
      detail: d.detail.trim(),
      tag: tag,
      isDefault: d.isDefault,
      distanceKm: DISTANCE_VALUES[d.distanceIndex],
      poiName: d.poiName
    }
    addressApi.save(payload).then((list) => {
      toast.success('保存成功')
      if (d.from === 'confirm') {
        const saved = list.find((a) => a.name === payload.name && a.detail === payload.detail)
        if (saved) wx.setStorageSync('selectedAddressId', saved.id)
        setTimeout(() => wx.navigateBack({ delta: 2 }), 600)
      } else {
        setTimeout(() => wx.navigateBack(), 600)
      }
    }).catch((err) => toast.fail((err && err.msg) || '保存失败'))
  }
})
