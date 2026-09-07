// pages/group/detail.js —— 拼团详情页（优化 5：拼团进度 / 成员 / 倒计时 / 参团流程 / 分享裂变）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { pad2, add, priceText } = require('../../utils/format.js');

const STATUS_MAP = {
  1: { text: '拼团中', cls: 'orange' },
  2: { text: '已成团', cls: 'green' },
  3: { text: '未成团已退款', cls: 'gray' }
};

Page({
  data: {
    id: 0,
    loading: true,
    group: null,
    goods: null,
    joined: false,
    myOrderId: null,
    statusText: '',
    statusCls: '',
    lack: 0,
    saved: '0.00',       // 已省金额（originalPrice - groupPrice）
    progress: 0,         // 成团进度百分比
    emptySlots: 0,       // 虚线空位数量
    remain: '',          // 倒计时文案
    ended: false,
    imgErr: false,
    // SKU 弹层
    skuShow: false,
    selected: [],        // 各维度选中下标
    specText: '',
    skuAllSelected: false,
    curStock: 0,
    count: 1,
    paying: false
  },

  onLoad(options) {
    const id = Number(options.id) || 0;
    this.setData({ id });
    this.loadDetail(true);
  },

  onShow() {
    this.startTimer();
  },

  onHide() {
    this.stopTimer();
  },

  onUnload() {
    this.stopTimer();
  },

  // ===== 数据加载 =====
  loadDetail(first) {
    return api.getGroupDetail(this.data.id).then(res => {
      const sm = STATUS_MAP[res.status] || STATUS_MAP[1];
      const lack = Math.max(0, res.requiredCount - res.joinedCount);
      const saved = priceText(add(res.originalPrice, -res.groupPrice));
      const progress = res.requiredCount
        ? Math.min(100, Math.round(res.joinedCount / res.requiredCount * 100))
        : 0;
      this.setData({
        group: res,
        goods: res.goods || null,
        joined: !!res.joined,
        myOrderId: res.myOrderId || null,
        statusText: sm.text,
        statusCls: sm.cls,
        lack,
        saved,
        progress,
        emptySlots: res.status === 1 ? lack : 0,
        loading: false
      });
      this.tick();
    }).catch(() => {
      if (first) this.setData({ loading: false });
    });
  },

  // ===== 倒计时 =====
  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => this.tick(), 1000);
    this.tick();
  },
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  tick() {
    const g = this.data.group;
    if (!g) return;
    const end = new Date(String(g.endTime).replace(/-/g, '/')).getTime();
    const diff = Math.floor((end - Date.now()) / 1000);
    if (isNaN(diff) || diff <= 0) {
      if (!this.data.ended) this.setData({ remain: '已截止', ended: true });
      return;
    }
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const text = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    if (text !== this.data.remain || this.data.ended) {
      this.setData({ remain: text, ended: false });
    }
  },

  // ===== SKU 弹层（价格固定为拼团价）=====
  openSku() {
    const goods = this.data.goods;
    if (!goods) return;
    this.setData({
      skuShow: true,
      selected: [],
      specText: '',
      skuAllSelected: false,
      curStock: goods.stock || 0,
      count: 1
    });
  },
  closeSku() {
    this.setData({ skuShow: false });
  },
  selectSpec(e) {
    const { dim, index } = e.currentTarget.dataset;
    const goods = this.data.goods;
    if (!goods) return;
    const val = goods.specs[dim].values[index];
    if (dim === 0 && val.stock === 0) {
      toast.showToast('该规格暂时缺货');
      return;
    }
    const selected = this.data.selected.slice();
    selected[dim] = index;
    let stock = goods.stock;
    let all = true;
    const parts = [];
    goods.specs.forEach((d, di) => {
      const si = selected[di];
      if (si === undefined || si === null || si < 0) { all = false; return; }
      const v = d.values[si];
      parts.push(v.label);
      if (di === 0 && v.stock != null) stock = v.stock;
    });
    let count = this.data.count;
    if (count > stock) count = stock > 0 ? stock : 1;
    if (count < 1) count = 1;
    this.setData({
      selected,
      specText: all ? parts.join(' · ') : '',
      skuAllSelected: all,
      curStock: stock,
      count
    });
  },
  minusCount() {
    if (this.data.count <= 1) return;
    this.setData({ count: this.data.count - 1 });
  },
  plusCount() {
    if (this.data.count >= this.data.curStock) {
      toast.showToast('已达库存上限');
      return;
    }
    this.setData({ count: this.data.count + 1 });
  },

  // ===== 参团：提交订单 → Mock 支付 → 刷新 =====
  confirmJoin() {
    if (!this.data.skuAllSelected) {
      toast.showToast('请选择规格');
      return;
    }
    if (this.data.paying) return;
    const { id, specText, count } = this.data;
    this.setData({ paying: true });
    api.joinGroup({ groupId: id, specText, count }).then(res => {
      const order = res.order;
      this.closeSku();
      toast.showLoading('支付中（演示环境）...');
      // Mock 支付：2 秒后调 payOrder
      setTimeout(() => {
        api.payOrder(order.id).then(() => {
          toast.hideLoading();
          this.setData({ paying: false });
          getApp().refreshCartBadge();
          this.loadDetail(false).then(() => {
            if (this.data.group && this.data.group.status === 2) {
              toast.success('恭喜成团！');
            } else {
              toast.success('参团成功');
            }
          });
        }).catch(() => {
          toast.hideLoading();
          this.setData({ paying: false });
          this.loadDetail(false);
        });
      }, 2000);
    }).catch(() => {
      this.setData({ paying: false });
    });
  },

  // ===== 邀请好友参团（按钮触发分享面板）=====
  onInviteTap() {
    api.shareReward('group').then(() => {
      toast.showToast('分享成功 +5积分');
    }).catch(() => {});
  },

  // ===== 跳转 =====
  goOrder() {
    if (!this.data.myOrderId) return;
    wx.navigateTo({ url: '/pages/order/detail?id=' + this.data.myOrderId });
  },
  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },
  goRestart() {
    const pages = getCurrentPages();
    if (pages.length > 1 && pages[pages.length - 2].route === 'pages/group/list') {
      wx.navigateBack();
    } else {
      wx.navigateTo({ url: '/pages/group/list' });
    }
  },

  // ===== 图片兜底（契约 §5）=====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  },
  onMemberImgError(e) {
    const m = e.currentTarget.dataset.m;
    this.setData({ [`group.members[${m}]._imgErr`]: true });
  },

  // ===== 分享裂变 =====
  onShareAppMessage(e) {
    const g = this.data.group;
    const uid = getApp().globalData.userInfo.id;
    // 按钮触发的分享已在 onInviteTap 中领取奖励，此处仅处理右上角菜单分享（每日限 3 次，失败静默）
    if (!e || e.from !== 'button') {
      api.shareReward('group').then(() => {
        toast.showToast('分享成功 +5积分');
      }).catch(() => {});
    }
    if (!g) {
      return { title: '零食商城拼团', path: '/pages/group/list?inviteBy=' + uid };
    }
    return {
      title: '【还差' + this.data.lack + '人】' + g.name + ' 拼团价￥' + priceText(g.groupPrice),
      path: '/pages/group/detail?id=' + this.data.id + '&inviteBy=' + uid,
      imageUrl: g.pic
    };
  }
});
