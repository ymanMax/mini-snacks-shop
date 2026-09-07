// pages/order/confirm.js
// 订单确认页：支持「购物车结算(fromCart=1)」与「立即购买(buyNow=1&goodsId=...)」两种模式
// 数据层：统一走 api/index.js；金额一律使用接口 preview 返回的数字，禁止字符串拼接
// V1.1 优化2：自动最优券 + 配送费实时预览 + 超范围拦截 + 日期/时段两列配送选择
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { formatDate } = require('../../utils/format.js');

const app = getApp();
const DEFAULT_IMG = '/static/images/default.png';

// 配送时段（尽快送达 + 四个时间窗）
const ASAP_SLOT = '尽快送达（预计45分钟）';
const SLOT_OPTIONS = [ASAP_SLOT, '10:00-12:00', '14:00-16:00', '18:00-20:00', '20:00-22:00'];

// 配送费规则默认值（与 mock shop.deliveryRule 一致），meta 拉取成功后覆盖
const DEFAULT_RULE = { baseFee: 5, baseKm: 3, perKmFee: 1, maxKm: 60, freeThreshold: 59 };

// 配送费规则说明（弹层展示）
const FREIGHT_RULES = [
  '1. 起步配送费 5 元，包含 3 公里以内配送；',
  '2. 超出 3 公里部分，每公里加收 1 元；',
  '3. 单笔订单商品满 59 元，免收基础配送费（超出里程费照常收取）；',
  '4. 会员享受更低免配送费门槛（金卡 49 元、铂金/钻石 39 元）；',
  '5. 配送范围为门店周边 60 公里，超出范围的地址暂不支持配送；',
  '6. 配送费最终以提交订单时结算结果为准。'
];

/** URL 参数安全解码（buyNow 场景商品名/规格/图片均为 encode 传入） */
function safeDecode(v) {
  if (v === undefined || v === null) return '';
  const s = String(v);
  try {
    return decodeURIComponent(s);
  } catch (e) {
    return s;
  }
}

/** 拼接完整地址文本 */
function fullText(a) {
  if (!a) return '';
  if (a.full) return a.full;
  return (a.province || '') + (a.city || '') + (a.district || '') + (a.detail || '');
}

Page({
  data: {
    loading: true,
    submitting: false,
    mode: 'cart', // cart | buyNow

    preview: null, // 接口结算预览原始数据
    items: [], // 商品清单
    totalAmount: 0,
    couponDiscount: 0,
    freight: 0,
    payAmount: 0,
    fullReduce: 0,

    address: null, // 收货地址（含 fullText）
    addressId: null,

    // 配送日期 / 时段（两列选择）
    dateOptions: [],
    slotOptions: SLOT_OPTIONS,
    selDateKey: 'today',
    selSlot: ASAP_SLOT,
    deliveryDate: '',
    deliverySlot: ASAP_SLOT,

    // 优惠券
    couponList: [],
    couponId: null,
    couponName: '',
    couponAuto: false, // 是否自动选中最优券
    showCoupon: false,

    // 配送费 / 超范围
    freightRules: FREIGHT_RULES,
    showFreight: false,
    freightDetail: '', // 配送费计算依据小字
    outOfRange: false,
    maxKm: DEFAULT_RULE.maxKm,

    remark: '',
    payType: 1 // 1 微信支付 / 2 货到付款
  },

  onLoad(options) {
    const o = options || {};
    this.buyNowItems = [];
    this.loaded = false;
    this.couponTouched = false;   // 用户是否手动操作过优惠券
    this.triedAutoSwitch = false; // 是否已尝试过超范围自动换址
    this.freightRule = Object.assign({}, DEFAULT_RULE);
    this.freeThreshold = DEFAULT_RULE.freeThreshold;

    if (String(o.buyNow) === '1' && o.goodsId) {
      // B. 立即购买模式：入参构造结算 items，提交时同样传 items + fromCart:false
      this.buyNowItems = [
        {
          goodsId: Number(o.goodsId),
          name: safeDecode(o.name),
          pic: safeDecode(o.pic),
          specText: safeDecode(o.specText),
          price: Number(o.price) || 0, // 数字价格，禁止字符串
          count: Number(o.count) || 1
        }
      ];
      this.setData({ mode: 'buyNow' });
    } else {
      // A. 购物车结算模式
      this.setData({ mode: 'cart' });
    }

    // 配送日期选项：今天 / 明天
    const now = new Date();
    const tom = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateOptions = [
      { key: 'today', label: '今天', md: formatDate(now, 'MM-DD'), value: formatDate(now, 'YYYY-MM-DD') },
      { key: 'tomorrow', label: '明天', md: formatDate(tom, 'MM-DD'), value: formatDate(tom, 'YYYY-MM-DD') }
    ];
    this.setData({ dateOptions, selDateKey: 'today', selSlot: ASAP_SLOT });
    this.updateDelivery();

    // 先取配送规则（含会员免配送门槛），再预览，保证配送费依据文案口径统一
    this.loadFreightMeta().then(() => this.loadPreview(false));
  },

  onUnload() {
    toast.hideLoadingForce();
  },

  /**
   * 返回同步：
   * 1) 地址列表选择后回传 storage(selectedAddress) → 用该地址重新 preview 并清除标记
   * 2) 新增地址后返回且当前无地址 → 重新 preview 拉取默认地址与运费
   */
  onShow() {
    let sel = null;
    try {
      sel = wx.getStorageSync('selectedAddress');
    } catch (e) {
      sel = null;
    }
    if (sel && sel.id) {
      try {
        wx.removeStorageSync('selectedAddress');
      } catch (e) {
        /* ignore */
      }
      this.setData({
        addressId: Number(sel.id),
        address: Object.assign({}, sel, { fullText: fullText(sel) })
      });
      this.loadPreview(true);
      return;
    }
    if (this.loaded && !this.data.address) this.loadPreview(true);
  },

  /* ==================== 配送规则 ==================== */

  loadFreightMeta() {
    return api.shop.freight({ amount: 0, distanceKm: 0 }).then((res) => {
      const d = (res && res.data) || {};
      this.freightRule = Object.assign({}, DEFAULT_RULE, d.rule || {});
      this.freeThreshold = d.freeThreshold || this.freightRule.freeThreshold || DEFAULT_RULE.freeThreshold;
      this.setData({ maxKm: this.freightRule.maxKm || DEFAULT_RULE.maxKm });
    }).catch(() => {
      this.freightRule = Object.assign({}, DEFAULT_RULE);
      this.freeThreshold = DEFAULT_RULE.freeThreshold;
    });
  },

  /** 配送费计算依据小字：（{km}：起步5元含3km + 超程{extraKm}km×1元，满{freeThreshold}免基础费） */
  buildFreightDetail(km) {
    if (km === undefined || km === null) return '';
    const r = this.freightRule || DEFAULT_RULE;
    const d = Number(km) || 0;
    const extraKm = Math.max(0, Math.ceil(d - r.baseKm));
    return '（' + d + 'km：起步' + r.baseFee + '元含' + r.baseKm + 'km + 超程' +
      extraKm + 'km×' + r.perKmFee + '元，满' + this.freeThreshold + '免基础费）';
  },

  /* ==================== 结算预览 ==================== */

  buildPreviewParams() {
    const p = {};
    if (this.data.mode === 'buyNow') p.items = this.buyNowItems;
    else p.fromCart = true;
    if (this.data.addressId) p.addressId = this.data.addressId;
    if (this.data.couponId) p.couponId = this.data.couponId;
    return p;
  },

  loadPreview(withLoading) {
    if (withLoading) toast.showLoading('结算中...');
    return api.order
      .preview(this.buildPreviewParams())
      .then((res) => {
        const d = (res && res.data) || {};

        // 自动最优券：用户未手动选券且当前无券 → 以 bestCoupon.id 重新 preview（口径统一）
        if (!this.couponTouched && !this.data.couponId && d.bestCoupon && d.bestCoupon.id) {
          this.setData({
            couponId: d.bestCoupon.id,
            couponAuto: true,
            couponName: d.bestCoupon.name || ''
          });
          return this.loadPreview(withLoading); // 递归一次，couponId 已置位不会再次进入
        }

        const addr = d.address || null;
        const distanceKm = addr ? addr.distanceKm : null;
        this.setData({
          preview: d,
          items: d.items || [],
          totalAmount: Number(d.totalAmount) || 0,
          couponDiscount: Number(d.couponDiscount) || 0,
          freight: Number(d.freight) || 0,
          payAmount: Number(d.payAmount) || 0,
          fullReduce: Number(d.fullReduce) || 0,
          address: addr ? Object.assign({}, addr, { fullText: fullText(addr) }) : null,
          addressId: addr ? addr.id : null,
          couponName: d.coupon ? d.coupon.name : '',
          outOfRange: !!d.outOfRange,
          maxKm: d.maxKm || this.data.maxKm,
          freightDetail: this.buildFreightDetail(distanceKm),
          loading: false
        });
        // 选中的券若因地址/金额变化失效，本地同步清掉
        if (this.data.couponId && !d.coupon) {
          this.setData({ couponId: null, couponName: '', couponAuto: false });
        }
        this.loadCoupons(this.data.totalAmount);

        // 超范围拦截：默认地址超范围时，自动尝试切换到第一个可配送地址
        if (d.outOfRange && !this.triedAutoSwitch) {
          this.triedAutoSwitch = true;
          this.autoSwitchAddress();
        }
      })
      .catch(() => {
        this.setData({ loading: false });
      })
      .then(() => {
        if (withLoading) toast.hideLoading();
        this.loaded = true;
      });
  },

  /** 默认地址超范围 → 选第一个未超范围地址重新 preview（无则保持警示） */
  autoSwitchAddress() {
    api.address.list().then((res) => {
      const list = (res && res.data) || [];
      const ok = list.filter((a) => !a.outOfRange)[0];
      if (!ok) return;
      this.setData({
        addressId: ok.id,
        address: Object.assign({}, ok, { fullText: fullText(ok) })
      });
      toast.showToast('原地址超范围，已切换可配送地址');
      this.loadPreview(true);
    }).catch(() => {});
  },

  loadCoupons(amount) {
    api.coupon
      .usable(amount)
      .then((res) => {
        const list = ((res && res.data) || []).map((c) =>
          Object.assign({}, c, {
            // 展示文案在 JS 侧由数字生成（折扣券 88 → 8.8 折），WXML 不做金额运算
            amountText: c.type === 2 ? Number(c.discount) / 10 + '折' : '￥' + Number(c.discount),
            limitText: Number(c.threshold) > 0 ? '满' + Number(c.threshold) + '元可用' : '无门槛'
          })
        );
        this.setData({ couponList: list });
      })
      .catch(() => {});
  },

  /* ==================== 地址 ==================== */

  onTapAddress() {
    if (!this.data.address) {
      wx.navigateTo({ url: '/pages/newAddress/newAddress' });
      return;
    }
    wx.navigateTo({ url: '/pages/address/address?select=1' });
  },

  /** 超范围警示条「更换地址」 */
  onChangeAddress() {
    wx.navigateTo({ url: '/pages/address/address?select=1' });
  },

  /* ==================== 配送日期 / 时段 ==================== */

  updateDelivery() {
    const opts = this.data.dateOptions;
    const dateOpt = opts.filter((d) => d.key === this.data.selDateKey)[0] || opts[0] || {};
    const slot = this.data.selSlot;
    const deliverySlot = slot === ASAP_SLOT ? ASAP_SLOT : (dateOpt.label || '今天') + ' ' + slot;
    this.setData({ deliveryDate: dateOpt.value || '', deliverySlot });
  },

  onPickDate(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.selDateKey) return;
    this.setData({ selDateKey: key });
    this.updateDelivery();
  },

  onPickSlot(e) {
    const slot = e.currentTarget.dataset.slot;
    if (slot === this.data.selSlot) return;
    this.setData({ selSlot: slot });
    this.updateDelivery();
  },

  /* ==================== 优惠券 ==================== */

  onOpenCoupon() {
    this.setData({ showCoupon: true });
    // 金额可能变化，打开时刷新一次可用券
    this.loadCoupons(this.data.totalAmount);
  },

  onCloseCoupon() {
    this.setData({ showCoupon: false });
  },

  /** 选择优惠券：data-id 为 0 表示不使用（此后不再自动选最优券） */
  onPickCoupon(e) {
    const id = Number(e.currentTarget.dataset.id) || 0;
    const coupon = id ? this.data.couponList.filter((c) => c.id === id)[0] : null;
    this.couponTouched = true;
    this.setData({
      couponId: id || null,
      couponName: coupon ? coupon.name : '',
      couponAuto: false,
      showCoupon: false
    });
    this.loadPreview(true);
  },

  /* ==================== 配送费说明 / 备注 / 支付方式 ==================== */

  onShowFreight() {
    this.setData({ showFreight: true });
  },

  onCloseFreight() {
    this.setData({ showFreight: false });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onPickPayType(e) {
    this.setData({ payType: Number(e.currentTarget.dataset.type) || 1 });
  },

  /* ==================== 提交订单 ==================== */

  onSubmit() {
    if (this.data.submitting) return;
    // 地址为空拦截提交
    if (!this.data.address || !this.data.address.id) {
      toast.showToast('请先添加收货地址');
      return;
    }
    // 超范围拦截
    if (this.data.outOfRange) {
      toast.showToast('该地址超出配送范围，暂不支持配送');
      return;
    }
    if (!this.data.items.length) {
      toast.showToast('没有可结算的商品');
      return;
    }

    const p = {
      addressId: this.data.address.id,
      remark: this.data.remark,
      deliveryDate: this.data.deliveryDate,
      deliverySlot: this.data.deliverySlot,
      payType: this.data.payType
    };
    if (this.data.couponId) p.couponId = this.data.couponId;
    if (this.data.mode === 'buyNow') {
      p.items = this.buyNowItems;
      p.fromCart = false; // 立即购买不从购物车扣减
    } else {
      p.fromCart = true; // 购物车结算：接口自动移除已购项
    }

    this.setData({ submitting: true });
    toast.showLoading('提交中...');
    api.order
      .create(p)
      .then((res) => {
        toast.hideLoading();
        const order = (res && res.data) || {};
        // 下单后同步购物车角标（购物车结算模式会移除已购项）
        app.refreshCartBadge();
        toast.showSuccess('下单成功');
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/order/detail?id=' + order.id + '&justCreated=1' });
        }, 800);
      })
      .catch(() => {
        toast.hideLoading();
        this.setData({ submitting: false });
      });
  },

  /* ==================== 杂项 ==================== */

  onImgError(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['items[' + index + '].pic']: DEFAULT_IMG });
  }
});
