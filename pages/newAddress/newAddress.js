// pages/newAddress/newAddress.js — 新增/编辑收货地址（V1.1 优化2 增强）
// 地区选择改用原生 picker mode="region"，不再依赖 utils/area.js
// 数据统一走 api/index.js；toast/confirm 走 utils/toast.js
// 新增：地图选点（半屏 POI 面板 + 搜索过滤）、模拟重新定位、距离展示与超范围提示
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const TAGS = ['家', '学校', '公司'];
const PHONE_REG = /^1\d{10}$/;
const DEFAULT_MAX_KM = 60;

Page({
  data: {
    id: null,
    isEdit: false,
    tags: TAGS,
    // 表单字段
    name: '',
    phone: '',
    region: [],        // [省, 市, 区]（picker mode="region"）
    regionText: '',
    detail: '',
    tag: '家',
    isDefault: false,

    // 地图选点 / 距离
    distanceKm: null,  // 选点后或编辑回填的当前距离（km）
    maxKm: DEFAULT_MAX_KM,
    showPoi: false,
    poiLoading: false,
    pois: [],          // 全量 POI
    poiView: [],       // 搜索过滤后的 POI
    poiKeyword: ''
  },

  onLoad(options) {
    const id = options && options.id ? Number(options.id) : null;
    this.loadMaxKm();
    if (id) {
      this.setData({ id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑地址' });
      this.loadDetail(id);
    } else {
      wx.setNavigationBarTitle({ title: '新增地址' });
    }
  },

  /* ---------- 配送范围（用于超范围提示） ---------- */
  loadMaxKm() {
    api.shop.freight({ amount: 0, distanceKm: 0 }).then((res) => {
      const d = (res && res.data) || {};
      const maxKm = (d.rule && d.rule.maxKm) || DEFAULT_MAX_KM;
      this.setData({ maxKm });
    }).catch(() => {});
  },

  /* ---------- 编辑模式：回填 ---------- */
  loadDetail(id) {
    toast.showLoading('加载中...');
    api.address.detail(id).then((res) => {
      toast.hideLoading();
      const a = res.data || {};
      const region = [a.province, a.city, a.district].filter(Boolean);
      this.setData({
        name: a.name || '',
        phone: a.phone || '',
        region,
        regionText: region.length === 3 ? region.join(' ') : '',
        detail: a.detail || '',
        tag: a.tag || '家',
        isDefault: !!a.isDefault,
        distanceKm: (a.distanceKm !== undefined && a.distanceKm !== null) ? Number(a.distanceKm) : null
      });
    }).catch(() => toast.hideLoading());
  },

  /* ---------- 表单输入 ---------- */
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onDetailInput(e) {
    this.setData({ detail: e.detail.value });
  },

  onRegionChange(e) {
    const region = e.detail.value || [];
    this.setData({ region, regionText: region.join(' ') });
  },

  onTagTap(e) {
    this.setData({ tag: e.currentTarget.dataset.tag });
  },

  onDefaultChange(e) {
    this.setData({ isDefault: !!e.detail.value });
  },

  /* ==================== 地图选点 ==================== */

  onOpenMap() {
    toast.showLoading('正在打开地图...');
    setTimeout(() => {
      toast.hideLoading();
      this.setData({ showPoi: true });
      this.loadPois();
    }, 500);
  },

  onClosePoi() {
    this.setData({ showPoi: false });
  },

  loadPois() {
    if (this.poisCache) {
      this.setData({
        pois: this.poisCache,
        poiView: this.filterPois(this.poisCache, this.data.poiKeyword)
      });
      return;
    }
    this.setData({ poiLoading: true });
    api.address.mapPois().then((res) => {
      const d = (res && res.data) || {};
      const pois = d.pois || [];
      this.poisCache = pois;
      this.setData({
        pois,
        poiView: this.filterPois(pois, this.data.poiKeyword),
        poiLoading: false,
        maxKm: d.maxKm || this.data.maxKm
      });
    }).catch(() => this.setData({ poiLoading: false }));
  },

  filterPois(list, kw) {
    const k = String(kw || '').trim().toLowerCase();
    if (!k) return (list || []).slice();
    return (list || []).filter((p) =>
      String(p.name || '').toLowerCase().indexOf(k) > -1 ||
      String(p.district || '').toLowerCase().indexOf(k) > -1 ||
      String(p.detail || '').toLowerCase().indexOf(k) > -1
    );
  },

  onPoiSearch(e) {
    const kw = e.detail.value;
    this.setData({ poiKeyword: kw, poiView: this.filterPois(this.data.pois, kw) });
  },

  onPickPoi(e) {
    const id = Number(e.currentTarget.dataset.id);
    const poi = this.data.pois.filter((p) => p.id === id)[0];
    if (!poi) return;
    this.applyPoi(poi);
    this.setData({ showPoi: false });
    toast.showSuccess('已选：' + poi.name);
  },

  /** 🎯 重新定位（模拟）：loading 800ms → 随机选中一个 POI 并回填 */
  onRelocate() {
    if (!this.data.pois.length) {
      toast.showToast('暂无可定位地点');
      return;
    }
    toast.showLoading('定位中...');
    setTimeout(() => {
      toast.hideLoading();
      const pois = this.data.pois;
      const poi = pois[Math.floor(Math.random() * pois.length)];
      this.applyPoi(poi);
      this.setData({ showPoi: false });
      toast.showToast('已定位到：' + poi.name + '（模拟定位）');
    }, 800);
  },

  /** 回填 POI：district / detail / distanceKm（记录在 data，save 时一并提交） */
  applyPoi(poi) {
    let district = poi.district || '';
    let province = (this.data.region && this.data.region[0]) || '广东省';
    let city = (this.data.region && this.data.region[1]) || '深圳市';
    // 解析形如「惠阳区（惠州市）」→ 城市=惠州市，区=惠阳区
    const m = district.match(/^(.*?)（(.+?)）$/);
    if (m) {
      district = m[1];
      if (m[2]) city = m[2];
    }
    const region = [province, city, district].filter(Boolean);
    this.setData({
      region,
      regionText: region.length === 3 ? region.join(' ') : '',
      detail: poi.detail || this.data.detail,
      distanceKm: Number(poi.distanceKm) || 0
    });
  },

  /* ---------- 保存 ---------- */
  onSave() {
    const { id, isEdit, name, phone, region, detail, tag, isDefault, distanceKm } = this.data;
    if (!name || !name.trim()) {
      toast.showError('请填写收货人姓名');
      return;
    }
    if (!PHONE_REG.test(phone)) {
      toast.showError('请填写正确的 11 位手机号');
      return;
    }
    if (!region || region.length !== 3 || !region[0]) {
      toast.showError('请选择所在地区');
      return;
    }
    if (!detail || !detail.trim()) {
      toast.showError('请填写详细地址');
      return;
    }
    const payload = {
      name: name.trim(),
      phone,
      province: region[0],
      city: region[1],
      district: region[2],
      detail: detail.trim(),
      tag,
      isDefault
    };
    // 选点/编辑回填的距离一并提交（mock 会采用提交的 distanceKm）；未选点则不传由 mock 生成
    if (distanceKm !== null && distanceKm !== undefined && !isNaN(Number(distanceKm))) {
      payload.distanceKm = Number(distanceKm);
    }
    if (isEdit && id) payload.id = id;

    toast.showLoading('保存中...');
    api.address.save(payload).then(() => {
      toast.hideLoading();
      toast.showSuccess('保存成功');
      setTimeout(() => wx.navigateBack(), 800);
    }).catch(() => toast.hideLoading());
  },

  /* ---------- 删除（仅编辑模式） ---------- */
  onDelete() {
    toast.confirm('确定删除该收货地址吗？', '删除地址').then((ok) => {
      if (!ok) return;
      toast.showLoading('删除中...');
      api.address.remove(this.data.id).then(() => {
        toast.hideLoading();
        toast.showSuccess('删除成功');
        setTimeout(() => wx.navigateBack(), 800);
      }).catch(() => toast.hideLoading());
    });
  }
});
