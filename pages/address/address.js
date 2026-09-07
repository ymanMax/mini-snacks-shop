// pages/address/address.js —— 地址列表（标签筛选 / 选择 / 默认 / 编辑 / 删除）
const app = getApp();
const { addressApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    list: [],
    filtered: [],
    from: '',
    loading: true,
    tags: ['全部', '家', '学校', '公司'],
    activeTag: '全部'
  },

  onLoad(options) {
    this.setData({ from: options.from || '' });
  },

  onShow() {
    this.load();
  },

  load() {
    addressApi.list().then((list) => {
      // 默认地址智能置顶
      list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      this.setData({ list, loading: false }, () => this.applyFilter());
    }).catch(() => this.setData({ loading: false }));
  },

  switchTag(e) {
    this.setData({ activeTag: e.currentTarget.dataset.tag }, () => this.applyFilter());
  },

  applyFilter() {
    const tag = this.data.activeTag;
    const filtered = tag === '全部' ? this.data.list : this.data.list.filter((a) => a.tag === tag);
    this.setData({ filtered });
  },

  noop() {},

  // 选择地址（订单确认页进入）
  selectAddress(e) {
    if (this.data.from !== 'confirm') return;
    const id = Number(e.currentTarget.dataset.id);
    const addr = this.data.list.find((a) => a.id === id);
    if (addr.distanceKm > 20) {
      toast.showToast('该地址暂不支持配送（超出 20km）');
      return;
    }
    app.globalData.selectedAddress = addr;
    wx.navigateBack();
  },

  setDefault(e) {
    const id = Number(e.currentTarget.dataset.id);
    addressApi.setDefault(id).then(() => {
      toast.showSuccess('已设为默认');
      this.load();
    });
  },

  edit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/newAddress/newAddress?id=' + id });
  },

  add() {
    wx.navigateTo({ url: '/pages/newAddress/newAddress' });
  },

  // mock 地图选点
  chooseOnMap() {
    wx.navigateTo({ url: '/pages/address/map/map' });
  },

  remove(e) {
    const id = Number(e.currentTarget.dataset.id);
    toast.showModal('确定删除这个收货地址吗？', '删除地址').then((ok) => {
      if (!ok) return;
      addressApi.remove(id).then(() => {
        toast.showSuccess('已删除');
        this.load();
      });
    });
  }
});
