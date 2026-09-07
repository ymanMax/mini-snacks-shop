// pages/newAddress/newAddress.js —— 新建 / 编辑收货地址
const app = getApp();
const { addressApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const TAGS = ['家', '学校', '公司'];

Page({
  data: {
    id: null,
    name: '',
    phone: '',
    region: ['上海市', '上海市', '浦东新区'],
    detail: '',
    tags: TAGS,
    tagIndex: 0,
    isDefault: false,
    distanceKm: 3,
    distanceText: '约 3 km'
  },

  onShow() {
    // 地图选点回填
    const picked = app.globalData ? app.globalData.mapPickedAddress : null;
    if (picked) {
      app.globalData.mapPickedAddress = null;
      const patch = {
        region: picked.region,
        detail: picked.detail,
        distanceKm: picked.distanceKm,
        distanceText: '约 ' + picked.distanceKm + ' km'
      };
      this.setData(patch);
      toast.showToast('已在地图上选择位置');
    }
  },

  onLoad(options) {
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑地址' });
      addressApi.list().then((list) => {
        const a = list.find((x) => String(x.id) === String(options.id));
        if (!a) return;
        this.setData({
          id: a.id,
          name: a.name,
          phone: a.phone,
          region: [a.province, a.city, a.district],
          detail: a.detail,
          tagIndex: Math.max(0, TAGS.indexOf(a.tag)),
          isDefault: !!a.isDefault,
          distanceKm: a.distanceKm,
          distanceText: '约 ' + a.distanceKm + ' km'
        });
      });
    }
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },

  onRegion(e) {
    this.setData({ region: e.detail.value });
  },

  chooseOnMap() {
    wx.navigateTo({ url: '/pages/address/map/map' });
  },

  pickTag(e) {
    this.setData({ tagIndex: Number(e.currentTarget.dataset.index) });
  },

  onDefault(e) {
    this.setData({ isDefault: e.detail.value });
  },

  onDistance(e) {
    const v = Number(e.detail.value);
    this.setData({ distanceKm: v, distanceText: '约 ' + v + ' km' });
  },

  save() {
    const { id, name, phone, region, detail, tags, tagIndex, isDefault, distanceKm } = this.data;
    if (!name.trim()) return toast.showToast('请填写收货人姓名');
    if (!/^1\d{10}$/.test(phone) && !/^\d{3}\*{4}\d{4}$/.test(phone)) {
      return toast.showToast('请输入正确的手机号');
    }
    if (!detail.trim()) return toast.showToast('请填写详细地址');

    const payload = {
      name: name.trim(),
      phone,
      province: region[0],
      city: region[1],
      district: region[2],
      detail: detail.trim(),
      tag: tags[tagIndex],
      isDefault,
      distanceKm
    };
    if (id) payload.id = id;
    addressApi.save(payload).then(() => {
      toast.showSuccess(id ? '已保存修改' : '地址添加成功');
      setTimeout(() => wx.navigateBack(), 800);
    });
  }
});
