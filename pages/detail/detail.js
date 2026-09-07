/**
 * 商品详情页
 *
 * 功能：媒体区（轮播 + 视频切换）/ 价格信息 / 已选规格 / SKU 半屏弹层（规格·口味·数量）
 *      / 图文详情 / 评价（汇总 + 精选 + 展开更多）/ 看了又看 / 底部操作栏（收藏·购物车·加购·立即购买）
 *
 * 规范：
 *  - 取数一律走 api/index.js；金额展示走 utils/format.wxs（JS 侧 utils/format.js）
 *  - 图片 binderror 回退 /static/images/default.png；视频 binderror 隐藏视频 Tab
 *  - toast/loading 统一 utils/toast.js；骨架屏 skeleton；空态 empty-state
 *  - 加购后 getApp().refreshCartBadge()；cartChange 事件 onShow 注册 / onHide 注销
 *  - onLoad 兼容 options.id 与 options.product_id
 */
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { formatPrice } = require('../../utils/format.js');

const app = getApp();

const DEFAULT_IMG = '/static/images/default.png';
const DEFAULT_AVATAR = '/static/images/avatar.png';
const REVIEW_SIZE = 3; // 精选评价条数（每页）

Page({
  data: {
    id: 0,
    loading: true, // 首屏骨架屏
    loadError: false,
    goods: {},
    DEFAULT_IMG,
    DEFAULT_AVATAR,

    /* ---------- 媒体区 ---------- */
    pics: [],
    swiperCurrent: 0,
    showVideoTab: false,
    mediaTab: 'image', // image | video
    videoPoster: '',

    /* ---------- 价格 / 规格 ---------- */
    curPrice: 0,
    priceFrom: true, // 未选规格 → 显示 "起"
    curStock: 0,
    curSpecPic: '',
    specSel: [], // 各维度选中下标，-1 表示未选
    specText: '', // 已选文案：规格 · 口味
    specDone: false, // 是否已选完整
    count: 1,

    /* ---------- SKU 弹层 ---------- */
    showSku: false,
    skuMode: 'cart', // cart | buy

    /* ---------- 图文详情 ---------- */
    detailImgs: [],

    /* ---------- 评价 ---------- */
    reviewSummary: null,
    reviews: [],
    reviewTotal: 0,
    reviewCurrent: 0,
    reviewLoading: false,
    reviewNoMore: false,

    /* ---------- 看了又看 ---------- */
    recommends: [],

    /* ---------- 收藏 / 购物车 ---------- */
    isCollect: false,
    cartCount: 0,

    /* ---------- 领券条（V1.1 优化1） ---------- */
    couponBar: [], // 价格卡下方横向胶囊（合并列表前 3 张）
    allCoupons: [], // 全部可领 / 可用券（半屏弹层展示）
    showCouponPop: false
  },

  /* ==================== 生命周期 ==================== */

  onLoad(options) {
    const id = Number((options && (options.id || options.product_id)) || 0);
    this._adding = false;
    this._collecting = false;
    this._receiving = false;
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, loadError: true });
      return;
    }
    // 浏览足迹（静默，失败不打扰）
    api.collect.footprintAdd(id).catch(() => {});
    this.loadDetail();
    this.loadReviewSummary();
    this.loadReviews(true);
    this.loadRecommend();
  },

  onShow() {
    this.setData({ cartCount: (app.globalData && app.globalData.cartCount) || 0 });
    this.offCartChange();
    this._onCartChange = (count) => this.setData({ cartCount: Number(count) || 0 });
    app.on('cartChange', this._onCartChange);
  },

  onHide() {
    this.offCartChange();
  },

  onUnload() {
    this.offCartChange();
    toast.hideLoadingForce();
  },

  offCartChange() {
    if (this._onCartChange) {
      app.off('cartChange', this._onCartChange);
      this._onCartChange = null;
    }
  },

  /** 遮罩禁止穿透滚动 */
  noop() {},

  /* ==================== 数据加载 ==================== */

  loadDetail() {
    this.setData({
      loading: true,
      loadError: false,
      couponBar: [],
      allCoupons: [],
      showCouponPop: false
    });
    return api.goods.detail(this.data.id).then((res) => {
      const goods = res.data || {};
      const pics = ((goods.pics && goods.pics.length ? goods.pics : [goods.pic]) || [])
        .filter(Boolean)
        .slice(0, 6);
      if (!pics.length) pics.push(DEFAULT_IMG);
      const specs = goods.specs || [];
      this.setData({
        goods,
        pics,
        detailImgs: (goods.detailImages || []).slice(),
        showVideoTab: !!goods.videoUrl,
        mediaTab: 'image',
        videoPoster: goods.videoCover || goods.pic || DEFAULT_IMG,
        isCollect: !!goods.isCollect,
        curPrice: Number(goods.minPrice) || 0,
        priceFrom: true,
        curStock: Number(goods.stock) || 0,
        curSpecPic: '',
        specSel: specs.map(() => -1),
        specText: '',
        specDone: false,
        count: 1,
        swiperCurrent: 0,
        loading: false,
        loadError: false
      });
      // 领券条（静默加载，失败不展示）
      this.loadCoupons(goods.minPrice);
    }).catch(() => {
      this.setData({ loading: false, loadError: true });
    });
  },

  /** 空态按钮：重新加载 */
  onReload() {
    if (!this.data.id) return;
    this.loadDetail();
    this.loadReviewSummary();
    this.loadReviews(true);
    this.loadRecommend();
  },

  loadReviewSummary() {
    return api.review.goodsSummary(this.data.id).then((res) => {
      this.setData({ reviewSummary: res.data || null });
    }).catch(() => {});
  },

  /**
   * 评价列表
   * @param {boolean} reset true=第一页（精选 3 条）；false=展开加载下一页
   */
  loadReviews(reset) {
    if (this.data.reviewLoading) return Promise.resolve();
    const current = reset ? 1 : this.data.reviewCurrent + 1;
    this.setData({ reviewLoading: true });
    return api.review.goodsPage({
      goodsId: this.data.id,
      current,
      size: REVIEW_SIZE
    }).then((res) => {
      const data = res.data || {};
      const records = data.records || [];
      const total = data.total || 0;
      const list = reset ? records : this.data.reviews.concat(records);
      this.setData({
        reviews: list,
        reviewTotal: total,
        reviewCurrent: data.current || current,
        reviewLoading: false,
        reviewNoMore: list.length >= total || records.length === 0
      });
    }).catch(() => {
      this.setData({ reviewLoading: false });
    });
  },

  /** 查看全部 N 条评价：页内展开下一页 */
  onMoreReviews() {
    if (this.data.reviewLoading || this.data.reviewNoMore) return;
    this.loadReviews(false);
  },

  loadRecommend() {
    return api.goods.recommend(this.data.id).then((res) => {
      this.setData({ recommends: res.data || [] });
    }).catch(() => {});
  },

  /* ==================== 领券条（V1.1 优化1） ==================== */

  /**
   * 领券条数据：api.coupon.usable(minPrice)（已持有可用 → 去使用）
   * + api.coupon.available() 中未领取且 threshold <= minPrice 的模板（→ 领），
   * 合并后取前 3 张做横向胶囊，整条点击展开半屏弹层显示全部。
   */
  loadCoupons(minPrice) {
    const amount = Number(minPrice) || 0;
    return Promise.all([
      api.coupon.usable(amount).catch(() => null),
      api.coupon.available().catch(() => null)
    ]).then((arr) => {
      const usable = (arr[0] && arr[0].data) || [];
      const templates = (arr[1] && arr[1].data) || [];
      const claimable = templates
        .filter((t) => !t.received && Number(t.threshold) <= amount)
        .map((t) => ({
          key: 'tpl-' + t.id,
          receiveId: t.id,
          name: t.name,
          scope: t.scope || '全场通用',
          expireText: '领取后 ' + (Number(t.expireDays) || 0) + ' 天内有效',
          owned: false
        }));
      const owned = usable.map((c) => ({
        key: 'own-' + c.id,
        receiveId: c.couponId || c.id,
        name: c.name,
        scope: c.scope || '全场通用',
        expireText: c.expireTime ? c.expireTime + ' 到期' : '',
        owned: true
      }));
      const allCoupons = claimable.concat(owned);
      this.setData({ allCoupons, couponBar: allCoupons.slice(0, 3) });
    });
  },

  /** 整条可点击：展开半屏弹层显示全部可领券 */
  onOpenCouponPop() {
    if (!this.data.allCoupons.length) return;
    this.setData({ showCouponPop: true });
  },

  onCloseCouponPop() {
    this.setData({ showCouponPop: false });
  },

  /** 领券 / 去使用（data-from: bar=胶囊条 | pop=弹层） */
  onReceiveCoupon(e) {
    const from = e.currentTarget.dataset.from || 'bar';
    const index = Number(e.currentTarget.dataset.index);
    const list = from === 'pop' ? this.data.allCoupons : this.data.couponBar;
    const c = list[index];
    if (!c) return;

    // 已领取 → 去使用：跳购物车（结算时自动享最优券）
    if (c.owned) {
      this.setData({ showCouponPop: false });
      wx.switchTab({
        url: '/pages/cart/cart',
        fail: () => toast.showError('打开购物车失败')
      });
      return;
    }

    if (this._receiving) return;
    this._receiving = true;
    api.coupon.receive(c.receiveId).then(() => {
      toast.showToast('领取成功');
      // 领取成功后该券切换为「去使用」
      const allCoupons = this.data.allCoupons.map((x) =>
        x.key === c.key ? Object.assign({}, x, { owned: true }) : x
      );
      this.setData({ allCoupons, couponBar: allCoupons.slice(0, 3) });
    }).catch(() => {
      // http 层已 toast 错误（已领取过 / 已领完等）
    }).then(() => {
      this._receiving = false;
    });
  },

  /* ==================== 媒体区 ==================== */

  onSwiperChange(e) {
    this.setData({ swiperCurrent: Number(e.detail.current) || 0 });
  },

  onSwitchMedia(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.mediaTab) return;
    this.setData({ mediaTab: tab });
  },

  /** 视频加载失败：隐藏视频 Tab，仅保留图片轮播 */
  onVideoError() {
    this.setData({ showVideoTab: false, mediaTab: 'image' });
    toast.showToast('视频加载失败，已为你切回图片');
  },

  onPicError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const pics = this.data.pics.slice();
    if (!pics.length || pics[index] === DEFAULT_IMG) return;
    pics[index] = DEFAULT_IMG;
    this.setData({ pics });
  },

  onPreviewImage(e) {
    const index = Number(e.currentTarget.dataset.index) || 0;
    const urls = this.data.pics;
    if (!urls.length) return;
    wx.previewImage({ current: urls[index], urls });
  },

  onDetailImgError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const key = 'detailImgs[' + index + ']';
    this.setData({ [key]: DEFAULT_IMG });
  },

  onSkuPicError() {
    this.setData({ curSpecPic: DEFAULT_IMG });
  },

  onAvatarError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const key = 'reviews[' + index + '].avatar';
    this.setData({ [key]: DEFAULT_AVATAR });
  },

  onReviewImgError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const ii = Number(e.currentTarget.dataset.ii);
    const key = 'reviews[' + index + '].images[' + ii + ']';
    this.setData({ [key]: DEFAULT_IMG });
  },

  onPreviewReviewImg(e) {
    const index = Number(e.currentTarget.dataset.index);
    const ii = Number(e.currentTarget.dataset.ii);
    const review = this.data.reviews[index];
    const urls = (review && review.images) || [];
    if (!urls.length) return;
    wx.previewImage({ current: urls[ii], urls });
  },

  /* ==================== SKU 弹层 ==================== */

  onOpenSku(e) {
    const mode = (e && e.currentTarget && e.currentTarget.dataset.mode) || 'cart';
    const goods = this.data.goods;
    if (!goods || !goods.id) return;
    if ((Number(goods.stock) || 0) <= 0) {
      toast.showToast('商品已售罄');
      return;
    }
    this.setData({ showSku: true, skuMode: mode });
  },

  onCloseSku() {
    this.setData({ showSku: false });
  },

  onSelectSpec(e) {
    const di = Number(e.currentTarget.dataset.di);
    const vi = Number(e.currentTarget.dataset.vi);
    const specs = (this.data.goods && this.data.goods.specs) || [];
    const dim = specs[di];
    if (!dim || !dim.values || !dim.values[vi]) return;
    const val = dim.values[vi];
    if (val.stock !== undefined && Number(val.stock) <= 0) {
      toast.showToast('该规格暂时缺货');
      return;
    }
    const specSel = this.data.specSel.slice();
    specSel[di] = vi;
    this.applySpec(specSel);
  },

  /**
   * 规格联动：价格 = 选中 value.price（无 price 维持第一维价格）；
   *          主图 = 选中 value.pic；库存 = 选中 value.stock；数量受库存上限约束
   */
  applySpec(specSel) {
    const goods = this.data.goods || {};
    const specs = goods.specs || [];
    const labels = [];
    let price = null;
    let stock = null;
    let pic = '';
    let done = true;

    specs.forEach((dim, di) => {
      const vi = specSel[di];
      const val = dim && dim.values ? dim.values[vi] : null;
      if (vi === undefined || vi < 0 || !val) {
        done = false;
        return;
      }
      labels.push(val.label);
      if (val.price !== undefined) price = Number(val.price);
      if (val.stock !== undefined) stock = Number(val.stock);
      if (val.pic) pic = val.pic;
    });

    // 是否已选中带价格的规格（未选中 → 展示 minPrice + "起"）
    const hasSelPrice = price !== null;
    if (stock === null) stock = Number(goods.stock) || 0;
    if (price === null) price = Number(goods.minPrice) || 0;

    const patch = {
      specSel,
      specText: labels.join(' · '),
      specDone: done,
      curPrice: price,
      priceFrom: !hasSelPrice,
      curStock: stock,
      curSpecPic: pic,
      count: Math.max(1, Math.min(this.data.count, stock || 1))
    };

    // 主图联动：切到该规格图（存在则同步轮播下标）
    if (pic) {
      const idx = this.data.pics.indexOf(pic);
      if (idx > -1) patch.swiperCurrent = idx;
      if (this.data.mediaTab !== 'image') patch.mediaTab = 'image';
    }
    this.setData(patch);
  },

  onMinus() {
    if (this.data.count <= 1) return;
    this.setData({ count: this.data.count - 1 });
  },

  onPlus() {
    const stock = Number(this.data.curStock) || 0;
    if (this.data.count >= stock) {
      toast.showToast('超出库存');
      return;
    }
    this.setData({ count: this.data.count + 1 });
  },

  /** 弹层底部按钮：加入购物车 / 立即购买 */
  onSkuConfirm(e) {
    const mode = (e && e.currentTarget && e.currentTarget.dataset.mode) || this.data.skuMode;
    if (!this.data.specDone) {
      toast.showToast('请选择规格');
      return;
    }
    const stock = Number(this.data.curStock) || 0;
    if (stock <= 0) {
      toast.showToast('该规格暂时缺货');
      return;
    }
    if (this.data.count > stock) {
      toast.showToast('超出库存');
      return;
    }
    if (mode === 'buy') this.buyNow();
    else this.addCart();
  },

  addCart() {
    if (this._adding) return;
    this._adding = true;
    const goods = this.data.goods || {};
    toast.showLoading('加入中...');
    api.cart.add({
      goodsId: goods.id,
      specText: this.data.specText,
      price: this.data.curPrice,
      count: this.data.count,
      stock: this.data.curStock,
      name: goods.name,
      pic: this.data.curSpecPic || goods.pic || DEFAULT_IMG
    }).then(() => {
      toast.hideLoading();
      toast.showSuccess('已加入购物车');
      if (app && app.refreshCartBadge) app.refreshCartBadge();
      this.setData({ showSku: false });
    }).catch(() => {
      toast.hideLoading();
    }).then(() => {
      this._adding = false;
    });
  },

  buyNow() {
    const goods = this.data.goods || {};
    const pic = this.data.curSpecPic || goods.pic || DEFAULT_IMG;
    const url = '/pages/order/confirm?buyNow=1'
      + '&goodsId=' + goods.id
      + '&price=' + this.data.curPrice
      + '&count=' + this.data.count
      + '&specText=' + encodeURIComponent(this.data.specText)
      + '&name=' + encodeURIComponent(goods.name || '')
      + '&pic=' + encodeURIComponent(pic);
    this.setData({ showSku: false });
    wx.navigateTo({
      url,
      fail: () => toast.showError('跳转失败，请稍后重试')
    });
  },

  /* ==================== 底部操作栏 ==================== */

  onToggleCollect() {
    if (this._collecting) return;
    this._collecting = true;
    api.collect.toggle(this.data.id).then((res) => {
      const data = res.data || {};
      const isCollect = data.isCollect !== undefined ? !!data.isCollect : !this.data.isCollect;
      this.setData({ isCollect, 'goods.isCollect': isCollect });
      toast.showToast(isCollect ? '收藏成功' : '已取消收藏');
    }).catch(() => {
      // http 层已 toast 错误
    }).then(() => {
      this._collecting = false;
    });
  },

  onGoCart() {
    wx.switchTab({
      url: '/pages/cart/cart',
      fail: () => toast.showError('打开购物车失败')
    });
  },

  /* ==================== 分享 ==================== */

  onShareAppMessage() {
    const goods = this.data.goods || {};
    // 分享奖励（V1.1 优化5-4）：异步发放 5 积分/次（3 次/天上限），
    // 静默失败不打扰用户；分享回调本身必须同步返回分享配置对象。
    api.share.reward('goods', goods.id || this.data.id)
      .then((res) => {
        const d = (res && res.data) || null;
        if (d && d.remainToday !== undefined && d.remainToday !== null) {
          toast.showToast('分享成功 +5积分');
        }
      })
      .catch(() => {});
    return {
      title: goods.name ? goods.name + ' ' + formatPrice(goods.minPrice) : '零食商城 · 好物推荐',
      imageUrl: goods.pic || DEFAULT_IMG,
      path: '/pages/detail/detail?id=' + this.data.id
    };
  }
});
