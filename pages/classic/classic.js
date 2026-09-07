/**
 * 分类页（TabBar 第 2 项）—— 经典左右结构
 *
 * 结构：左侧竖向分类导航（api.category.list）
 *      + 右侧吸顶筛选栏（排序 Tab / 半屏筛选面板）
 *      + 右侧商品分页列表（api.goods.page，scroll-view 上拉分页）
 *
 * 规范：
 *  - 取数一律走 api/index.js，禁止直接 require mock / 硬编码 wx.request
 *  - 金额展示统一 wxs fmt.formatPrice / fmt.priceNum
 *  - 图片 binderror 回退 /static/images/default.png
 *  - toast 统一 utils/toast.js；首屏骨架屏 skeleton；空态 empty-state
 *  - 加购由 goods-card 内部完成（含 api.cart.add + refreshCartBadge + toast）
 */
const api = require('../../api/index.js');

const DEFAULT_IMG = '/static/images/default.png';
const PAGE_SIZE = 10;

/** 价格区间（单选）：max 为 '' 表示不限上限 */
const PRICE_RANGES = [
  { label: '￥0 - 50', min: 0, max: 50 },
  { label: '￥50 - 100', min: 50, max: 100 },
  { label: '￥100 - 200', min: 100, max: 200 },
  { label: '￥200 以上', min: 200, max: '' }
];

/** 产地（多选，服务端按包含匹配） */
const ORIGIN_LIST = ['广东', '山东', '云南', '新疆', '内蒙古', '江苏', '浙江', '湖南', '福建', '进口'];

/** 生成一份空的筛选条件 */
function emptyFilter() {
  return { priceIndex: -1, origins: [], inStock: false };
}

/** 生成产地勾选项（draft 用，避免 wxml 内调用 indexOf） */
function buildOriginOptions(checkedList) {
  return ORIGIN_LIST.map((name) => ({
    name,
    checked: (checkedList || []).indexOf(name) > -1
  }));
}

Page({
  data: {
    /* ---------- 左侧分类导航 ---------- */
    categories: [],
    cateLoading: true,
    cateAnchor: '', // 左侧导航滚动定位（深链进入时定位到指定分类）
    curCategoryId: 0,
    curCategoryName: '',

    /* ---------- 排序 / 筛选 ---------- */
    sort: 'comprehensive', // comprehensive | sales | priceAsc | priceDesc
    priceAsc: true, // 价格 Tab 当前是否升序（控制 ↑↓ 高亮）
    showFilter: false,
    priceRanges: PRICE_RANGES,
    draftPriceIndex: -1,
    draftOrigins: buildOriginOptions([]),
    draftInStock: false,
    applied: emptyFilter(),
    hasFilter: false,

    /* ---------- 商品列表 ---------- */
    records: [],
    total: 0,
    current: 1,
    size: PAGE_SIZE,
    firstLoading: true, // 首屏骨架屏
    loadingMore: false, // 上拉加载中
    noMore: false, // 没有更多了
    scrollTop: 0,
    refreshing: false
  },

  onLoad(options) {
    // 请求序号：快速切换分类/筛选时丢弃过期响应
    this._seq = 0;
    this._loading = false;
    this._scrollTop = 0;
    this.loadCategories(options && (options.categoryId || options.id));
  },

  /* ==================== 分类导航 ==================== */

  loadCategories(presetId) {
    return api.category.list().then((res) => {
      const list = (res.data || []).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        iconSrc: c.icon || c.image || DEFAULT_IMG
      }));
      if (!list.length) {
        this.setData({ categories: [], cateLoading: false, firstLoading: false });
        return;
      }
      let index = 0;
      if (presetId) {
        const i = list.findIndex((c) => String(c.id) === String(presetId));
        if (i > -1) index = i;
      }
      this.setData({
        categories: list,
        cateLoading: false,
        curCategoryId: list[index].id,
        curCategoryName: list[index].name,
        cateAnchor: 'cate-' + list[index].id
      });
      this.loadList(true);
    }).catch(() => {
      this.setData({ cateLoading: false, firstLoading: false });
    });
  },

  onTapCategory(e) {
    const index = Number(e.currentTarget.dataset.index);
    const cate = this.data.categories[index];
    if (!cate || cate.id === this.data.curCategoryId) return;
    this.setData({
      curCategoryId: cate.id,
      curCategoryName: cate.name,
      cateAnchor: 'cate-' + cate.id
    });
    this.resetScrollTop();
    this.loadList(true); // 切换分类：重置分页（筛选条件保留）
  },

  onCateIconError(e) {
    const index = Number(e.currentTarget.dataset.index);
    const key = 'categories[' + index + '].iconSrc';
    this.setData({ [key]: DEFAULT_IMG });
  },

  /* ==================== 排序 ==================== */

  onTapSort(e) {
    const type = e.currentTarget.dataset.sort;
    let sort = this.data.sort;
    let priceAsc = this.data.priceAsc;
    if (type === 'price') {
      // 价格：点击在升序 / 降序间切换
      if (sort === 'priceAsc') {
        sort = 'priceDesc';
        priceAsc = false;
      } else {
        sort = 'priceAsc';
        priceAsc = true;
      }
    } else {
      sort = type;
    }
    if (sort === this.data.sort) return;
    this.setData({ sort, priceAsc });
    this.resetScrollTop();
    this.loadList(true);
  },

  /* ==================== 筛选面板 ==================== */

  onOpenFilter() {
    // 打开时以已生效条件回填草稿
    const applied = this.data.applied;
    this.setData({
      showFilter: true,
      draftPriceIndex: applied.priceIndex,
      draftOrigins: buildOriginOptions(applied.origins),
      draftInStock: !!applied.inStock
    });
  },

  onCloseFilter() {
    this.setData({ showFilter: false });
  },

  onTapPriceRange(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ draftPriceIndex: this.data.draftPriceIndex === index ? -1 : index });
  },

  onTapOrigin(e) {
    const index = Number(e.currentTarget.dataset.index);
    const key = 'draftOrigins[' + index + '].checked';
    this.setData({ [key]: !this.data.draftOrigins[index].checked });
  },

  onToggleInStock(e) {
    this.setData({ draftInStock: !!e.detail.value });
  },

  onResetFilter() {
    this.setData({
      draftPriceIndex: -1,
      draftOrigins: buildOriginOptions([]),
      draftInStock: false
    });
  },

  onConfirmFilter() {
    const origins = this.data.draftOrigins.filter((o) => o.checked).map((o) => o.name);
    const applied = {
      priceIndex: this.data.draftPriceIndex,
      origins,
      inStock: this.data.draftInStock
    };
    this.setData({
      applied,
      showFilter: false,
      hasFilter: applied.priceIndex > -1 || applied.origins.length > 0 || applied.inStock
    });
    this.resetScrollTop();
    this.loadList(true);
  },

  /** 空态按钮：清空筛选条件并重载 */
  onClearFilter() {
    this.setData({
      applied: emptyFilter(),
      draftPriceIndex: -1,
      draftOrigins: buildOriginOptions([]),
      draftInStock: false,
      hasFilter: false,
      showFilter: false
    });
    this.resetScrollTop();
    this.loadList(true);
  },

  /** 遮罩层禁止穿透滚动 */
  noop() {},

  /* ==================== 列表加载 / 分页 ==================== */

  /** 组装 api.goods.page 入参 */
  buildParams(current) {
    const applied = this.data.applied;
    const params = {
      categoryId: this.data.curCategoryId,
      sort: this.data.sort,
      current,
      size: this.data.size
    };
    const range = PRICE_RANGES[applied.priceIndex];
    if (range) {
      params.minPrice = range.min;
      if (range.max !== '') params.maxPrice = range.max;
    }
    if (applied.origins.length) params.origins = applied.origins.slice();
    if (applied.inStock) params.inStock = true;
    return params;
  },

  /**
   * 加载商品列表
   * @param {boolean} reset true=回到第一页（切换分类/排序/筛选）
   * @param {boolean} silent true=不显示骨架屏（下拉刷新时保留当前列表）
   */
  loadList(reset, silent) {
    if (this._loading || !this.data.curCategoryId) return Promise.resolve();
    this._loading = true;
    const seq = ++this._seq;
    const current = reset ? 1 : this.data.current + 1;
    if (reset) {
      this.setData({ firstLoading: !silent, loadingMore: false, noMore: false });
    } else {
      this.setData({ loadingMore: true });
    }

    return api.goods.page(this.buildParams(current)).then((res) => {
      this._loading = false;
      if (seq !== this._seq) return; // 过期响应丢弃
      const data = res.data || {};
      const records = data.records || [];
      const list = reset ? records : this.data.records.concat(records);
      const total = data.total || 0;
      this.setData({
        records: list,
        total,
        current: data.current || current,
        firstLoading: false,
        loadingMore: false,
        refreshing: false,
        noMore: list.length >= total || records.length === 0
      });
    }).catch(() => {
      this._loading = false;
      if (seq !== this._seq) return;
      this.setData({
        firstLoading: false,
        loadingMore: false,
        refreshing: false,
        noMore: this.data.records.length > 0
      });
    });
  },

  /** scroll-view 触底：加载下一页 */
  onLoadMore() {
    if (this.data.firstLoading || this.data.loadingMore || this.data.noMore) return;
    this.loadList(false);
  },

  /** 下拉刷新：重置分页（保留当前列表，不闪骨架屏） */
  onRefresh() {
    if (this.data.refreshing) return;
    this.setData({ refreshing: true });
    if (!this.data.curCategoryId) {
      // 分类尚未就绪（首屏失败）→ 重新拉取分类
      this.loadCategories().then(() => this.setData({ refreshing: false }));
      return;
    }
    this._loading = false; // 打断进行中的请求，过期响应由 _seq 丢弃
    this.loadList(true, true).then(() => this.setData({ refreshing: false }));
  },

  onScroll(e) {
    this._scrollTop = e.detail.scrollTop;
  },

  /** 列表回到顶部（先同步当前值再置 0，保证 setData 一定产生 diff） */
  resetScrollTop() {
    this.setData({ scrollTop: (this._scrollTop || 0) + 0.5 });
    this._scrollTop = 0;
    wx.nextTick(() => {
      this.setData({ scrollTop: 0 });
    });
  },

  /* 加购无需页面处理：goods-card 内部已完成 api.cart.add + toast + refreshCartBadge */

  onShareAppMessage() {
    return {
      title: this.data.curCategoryName
        ? this.data.curCategoryName + ' 零食精选 - 零食商城'
        : '分类 - 零食商城',
      path: '/pages/classic/classic'
    };
  }
});
