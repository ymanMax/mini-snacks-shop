// pages/newAddress/newAddress.js —— 新建/编辑地址页（改造，复用 utils/area.js 三级 picker）
const area = require('../../utils/area.js');
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const TAGS = ['家', '公司', '学校'];

// 模拟地图选点 POI 池（省市区需与 utils/area.js 数据一致，便于 picker 联动回填）
const POI_POOL = [
  { name: '创业大厦', province: '浙江省', city: '杭州市', district: '西湖区', detail: '文三路 100 号创业大厦 A 座' },
  { name: '温馨家园', province: '浙江省', city: '杭州市', district: '拱墅区', detail: '莫干山路 20 号温馨家园 3 幢' },
  { name: '科技园', province: '浙江省', city: '杭州市', district: '滨江区', detail: '江南大道 500 号科技园 8 号楼' },
  { name: '星光广场', province: '浙江省', city: '杭州市', district: '西湖区', detail: '文二路 388 号星光广场 2 层' },
  { name: '学府公寓', province: '浙江省', city: '杭州市', district: '滨江区', detail: '立业路 66 号学府公寓 5 幢' }
];

Page({
  data: {
    isEdit: false,
    form: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      tag: '家',
      isDefault: false
    },
    tags: TAGS,
    regionText: '请选择省 / 市 / 区',
    range: [[], [], []],   // 三级 picker 数据源
    value: [0, 0, 0],
    saving: false,
    // 模拟定位
    showMap: false,
    coordText: '',
    pois: [],
    distanceKm: null,      // 定位选点后生成，保存时一并提交
    distanceText: ''
  },

  onLoad(options) {
    this._id = (options || {}).id ? Number(options.id) : 0;
    this.initArea(() => {
      if (this._id) {
        this.setData({ isEdit: true });
        wx.setNavigationBarTitle({ title: '编辑地址' });
        api.getAddressList().then(list => {
          const addr = list.find(a => a.id === this._id);
          if (!addr) {
            toast.showToast('地址不存在');
            return;
          }
          this.setData({
            form: {
              name: addr.name,
              phone: addr.phone,
              province: addr.province,
              city: addr.city,
              district: addr.district,
              detail: addr.detail,
              tag: addr.tag || '家',
              isDefault: !!addr.isDefault
            },
            distanceKm: addr.distanceKm != null ? Number(addr.distanceKm) : null,
            distanceText: addr.distanceKm != null ? '距门店 ' + addr.distanceKm + ' km' : ''
          });
          this.syncRegionText();
          this.locateRegion(addr.province, addr.city, addr.district);
        }).catch(() => {});
      } else {
        this.applyRegion(0, 0, 0, false);
      }
    });
  },

  // ===== 省市区三级数据 =====
  initArea(cb) {
    area.getAreaInfo(arr => {
      this._area = arr;
      this._provinces = arr.filter(s => s.di === '00' && s.xian === '00');
      this.buildColumns(0, 0);
      cb && cb();
    });
  },

  citiesOf(pIndex) {
    const p = this._provinces[pIndex];
    if (!p) return [{ name: '' }];
    const list = this._area.filter(c => c.xian === '00' && c.di !== '00' && c.sheng === p.sheng);
    return list.length ? list : [{ name: '' }];
  },

  districtsOf(pIndex, cIndex) {
    const p = this._provinces[pIndex];
    const c = this.citiesOf(pIndex)[cIndex];
    if (!p || !c || !c.di) return [{ name: '' }];
    const list = this._area.filter(x => x.xian !== '00' && x.sheng === p.sheng && x.di === c.di);
    return list.length ? list : [{ name: '' }];
  },

  buildColumns(pIndex, cIndex) {
    this.setData({
      range: [
        this._provinces.map(p => p.name),
        this.citiesOf(pIndex).map(c => c.name),
        this.districtsOf(pIndex, cIndex).map(d => d.name)
      ]
    });
  },

  // 编辑模式：按名称定位 picker 下标
  locateRegion(province, city, district) {
    const pIndex = Math.max(0, this._provinces.findIndex(p => p.name === province));
    const cities = this.citiesOf(pIndex);
    let cIndex = cities.findIndex(c => c.name === city);
    if (cIndex < 0) cIndex = 0;
    const districts = this.districtsOf(pIndex, cIndex);
    let dIndex = districts.findIndex(d => d.name === district);
    if (dIndex < 0) dIndex = 0;
    this.buildColumns(pIndex, cIndex);
    this.setData({ value: [pIndex, cIndex, dIndex] });
  },

  onColumnChange(e) {
    const { column, value } = e.detail;
    const val = this.data.value.slice();
    val[column] = value;
    if (column === 0) {
      val[1] = 0;
      val[2] = 0;
      this.buildColumns(value, 0);
    } else if (column === 1) {
      val[2] = 0;
      this.buildColumns(val[0], value);
    }
    this.setData({ value: val });
  },

  onRegionChange(e) {
    const v = e.detail.value;
    this.applyRegion(v[0], v[1], v[2], true);
  },

  applyRegion(pIndex, cIndex, dIndex, writeForm) {
    this.buildColumns(pIndex, cIndex);
    this.setData({ value: [pIndex, cIndex, dIndex] });
    if (writeForm === false) return;
    const p = this._provinces[pIndex] || { name: '' };
    const c = this.citiesOf(pIndex)[cIndex] || { name: '' };
    const d = this.districtsOf(pIndex, cIndex)[dIndex] || { name: '' };
    this.setData({
      'form.province': p.name,
      'form.city': c.name,
      'form.district': d.name
    });
    this.syncRegionText();
  },

  syncRegionText() {
    const f = this.data.form;
    this.setData({
      regionText: (f.province || f.city || f.district)
        ? f.province + ' ' + f.city + ' ' + f.district
        : '请选择省 / 市 / 区'
    });
  },

  // ===== 表单 =====
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // ===== 模拟定位（mock 地图选点） =====
  openMockMap() {
    // 随机取 2~3 个 POI + 随机坐标文案
    const pool = POI_POOL.slice().sort(() => Math.random() - 0.5);
    const count = 2 + Math.floor(Math.random() * 2);
    const lng = (120.05 + Math.random() * 0.2).toFixed(2);
    const lat = (30.2 + Math.random() * 0.15).toFixed(2);
    this.setData({
      showMap: true,
      pois: pool.slice(0, count),
      coordText: '东经 ' + lng + '° 北纬 ' + lat + '°'
    });
  },

  closeMockMap() {
    this.setData({ showMap: false });
  },

  choosePoi(e) {
    const poi = this.data.pois[e.currentTarget.dataset.index];
    if (!poi) return;
    // 随机生成与门店的距离（0.5~6.0 km，一位小数）
    const distanceKm = Math.round((0.5 + Math.random() * 5.5) * 10) / 10;
    this.setData({
      showMap: false,
      'form.province': poi.province,
      'form.city': poi.city,
      'form.district': poi.district,
      'form.detail': poi.detail,
      distanceKm,
      distanceText: '距门店 ' + distanceKm + ' km'
    });
    this.syncRegionText();
    // 联动三级 picker 到回填的省市区
    if (this._provinces) this.locateRegion(poi.province, poi.city, poi.district);
    toast.success('已回填定位地址');
  },

  chooseTag(e) {
    this.setData({ 'form.tag': e.currentTarget.dataset.tag });
  },

  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail.value });
  },

  save() {
    if (this.data.saving) return;
    const f = this.data.form;
    if (!f.name.trim()) {
      toast.showToast('请填写收货人姓名');
      return;
    }
    if (!/^1\d{10}$/.test(f.phone.trim())) {
      toast.showToast('请填写 11 位手机号');
      return;
    }
    if (!f.province) {
      toast.showToast('请选择省市区');
      return;
    }
    if (!f.detail.trim()) {
      toast.showToast('请填写详细地址');
      return;
    }
    this.setData({ saving: true });
    const data = Object.assign({}, f, {
      name: f.name.trim(),
      phone: f.phone.trim(),
      detail: f.detail.trim()
    });
    if (this.data.distanceKm != null) data.distanceKm = this.data.distanceKm;
    if (this._id) data.id = this._id;
    api.saveAddress(data).then(() => {
      toast.success('保存成功');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1200);
    }).catch(() => {
      this.setData({ saving: false });
    });
  }
});
