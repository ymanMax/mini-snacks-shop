// pages/service/chat.js
// 在线客服会话页：欢迎语 → 售后自助运营卡片 → 常见问题快捷区；
// 发送问题走 api.service.reply（规则引擎），等待期间显示「对方正在输入...」灰点动画气泡；
// 会话 ≥2 条后可对客服评价（响应速度 / 解决问题 star-rate + 内容）→ api.service.rate
// 数据层统一走 api/index.js，禁止直接 require mock / 硬编码 wx.request
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const format = require('../../utils/format.js');

/** 会话消息类型 */
const MSG = {
  CS: 'cs', // 客服气泡（左）
  ME: 'me', // 用户气泡（右）
  TYPING: 'typing', // 对方正在输入（灰点动画）
  QUICK: 'quick', // 常见问题快捷胶囊区
  CARD: 'card' // 运营卡片（售后自助）
};

const SCORE_TEXT = { 1: '很差', 2: '较差', 3: '一般', 4: '满意', 5: '超赞' };
const FALLBACK_WELCOME = '您好，我是零食商城客服小零 🐿️～很高兴为您服务！';
const MAX_LEN = 100;

Page({
  data: {
    loading: true,
    msgs: [], // [{id,type,text,time,quick[]}]
    scrollInto: '', // scroll-view 定位锚点（底部双锚点交替，保证值变化即滚动）
    inputValue: '',
    sending: false, // 等待客服回复中
    canRate: false, // 对话消息 ≥2 条后开放评价
    hotQuestions: [],
    maxLen: MAX_LEN,

    // 客服评价弹层
    rateOpen: false,
    rateSubmitting: false,
    rate: { speed: 5, solve: 5, content: '' },
    rateText: { speed: SCORE_TEXT[5], solve: SCORE_TEXT[5] }
  },

  onLoad() {
    this.seq = 0; // 消息自增 id（同时作为 wx:key 与滚动锚点）
    this.anchorFlip = false;
    this.start();
  },

  onUnload() {
    toast.hideLoadingForce();
  },

  /* ==================== 会话初始化 ==================== */

  /** api.service.start → 欢迎语气泡 + 售后自助卡片 + 常见问题快捷区 */
  start() {
    this.setData({ loading: true });
    return api.service
      .start()
      .then((res) => {
        const d = (res && res.data) || {};
        const hotQuestions = d.hotQuestions || [];
        const msgs = [
          this.buildMsg(MSG.CS, d.welcome || FALLBACK_WELCOME),
          this.buildMsg(MSG.CARD, ''),
          this.buildMsg(MSG.QUICK, '')
        ];
        this.applyMsgs(msgs, {
          loading: false,
          hotQuestions,
          scrollInto: this.nextAnchor()
        });
      })
      .catch(() => {
        this.setData({ loading: false });
        toast.showError('客服暂时无法接入，请稍后重试');
      });
  },

  /** 构造一条消息（自增 id + 时间戳） */
  buildMsg(type, text, extra) {
    this.seq += 1;
    return Object.assign(
      {
        id: this.seq,
        type: type,
        text: text || '',
        time: format.formatDate(new Date(), 'HH:mm'),
        quick: []
      },
      extra || {}
    );
  },

  /** 底部双锚点交替：scroll-into-view 值每次变化，新消息自动滚到底 */
  nextAnchor() {
    this.anchorFlip = !this.anchorFlip;
    return this.anchorFlip ? 'chat-end-b' : 'chat-end-a';
  },

  /** 统一写入消息列表（一次 setData：消息 + 评价可用态 + 滚动锚点） */
  applyMsgs(msgs, extra) {
    let dialog = 0;
    msgs.forEach((m) => {
      if (m.type === MSG.CS || m.type === MSG.ME) dialog += 1;
    });
    this.setData(
      Object.assign(
        {
          msgs: msgs,
          canRate: dialog >= 2,
          scrollInto: this.nextAnchor()
        },
        extra || {}
      )
    );
  },

  /* ==================== 发送与自动回复 ==================== */

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  /** 输入栏发送（confirm-type="send" 回车同触发） */
  onSend() {
    const text = String(this.data.inputValue || '').trim();
    if (!text) {
      toast.showToast('请输入要咨询的问题');
      return;
    }
    if (this.data.sending) {
      toast.showToast('客服正在回复中，请稍候');
      return;
    }
    this.setData({ inputValue: '' });
    this.ask(text);
  },

  /** 常见问题胶囊点击 → 作为用户消息发送 */
  onQuickTap(e) {
    const q = e.currentTarget.dataset.q;
    if (!q) return;
    if (this.data.sending) {
      toast.showToast('客服正在回复中，请稍候');
      return;
    }
    this.ask(String(q));
  },

  /**
   * 提问：用户气泡 → 「对方正在输入...」占位气泡 → 客服回答气泡
   * matched=false（未命中规则）时回答末尾附常见问题快捷胶囊引导
   */
  ask(question) {
    const typing = this.buildMsg(MSG.TYPING, '');
    this.applyMsgs(this.data.msgs.concat([this.buildMsg(MSG.ME, question), typing]), {
      sending: true
    });

    api.service
      .reply(question)
      .then((res) => {
        const d = (res && res.data) || {};
        const answer = this.buildMsg(MSG.CS, d.answer || FALLBACK_WELCOME, {
          // 未命中：追加常见问题胶囊引导用户换个关键词提问
          quick: d.matched ? [] : this.data.hotQuestions
        });
        this.applyMsgs(
          this.data.msgs.filter((m) => m.id !== typing.id).concat([answer]),
          { sending: false }
        );
      })
      .catch(() => {
        // 失败移除「正在输入」占位，恢复可发送态
        this.applyMsgs(this.data.msgs.filter((m) => m.id !== typing.id), { sending: false });
        toast.showError('客服繁忙，请稍后再试');
      });
  },

  /* ==================== 运营卡片：售后自助 ==================== */

  /** 申请售后需先选订单：确认后跳订单列表，从订单详情进入申请页 */
  onCardApply() {
    toast
      .confirm('申请售后需先选择订单，是否前往「我的订单」选择？也可从订单详情页点击「申请售后」进入。', '售后自助')
      .then((ok) => {
        if (!ok) return;
        wx.navigateTo({ url: '/pages/order/list?status=0' });
      })
      .catch(() => {});
  },

  /** 查看售后进度 → 售后工单页 */
  onCardProgress() {
    wx.navigateTo({ url: '/pages/service/tickets' });
  },

  /* ==================== 客服评价 ==================== */

  openRate() {
    if (!this.data.canRate) {
      toast.showToast('与客服沟通 2 条消息后即可评价');
      return;
    }
    this.setData({ rateOpen: true });
  },

  closeRate() {
    this.setData({ rateOpen: false });
  },

  /** 星级打分（star-rate bind:change，data-key: speed|solve） */
  onRateChange(e) {
    const key = e.currentTarget.dataset.key;
    if (key !== 'speed' && key !== 'solve') return;
    const value = Math.min(5, Math.max(1, Number(e.detail.value) || 5));
    this.setData({
      ['rate.' + key]: value,
      ['rateText.' + key]: SCORE_TEXT[value]
    });
  },

  onRateInput(e) {
    this.setData({ 'rate.content': e.detail.value });
  },

  submitRate() {
    if (this.data.rateSubmitting) return;
    const rate = this.data.rate;
    this.setData({ rateSubmitting: true });
    toast.showLoading('提交中...');
    api.service
      .rate({ speed: rate.speed, solve: rate.solve, content: rate.content })
      .then(() => {
        toast.hideLoading();
        this.setData({ rateOpen: false, rateSubmitting: false });
        toast.showSuccess('感谢您的评价');
      })
      .catch(() => {
        toast.hideLoading();
        this.setData({ rateSubmitting: false });
      });
  }
});
