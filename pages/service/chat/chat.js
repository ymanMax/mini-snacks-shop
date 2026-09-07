// pages/service/chat/chat.js —— 客服会话：预设规则引擎自动回复 + 常见问题
const { serviceApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

const HISTORY_KEY = 'mock_chat_history';

// 规则引擎：关键词命中即回复（按顺序匹配）
const RULES = [
  {
    keys: ['退款', '退货', '售后', '换货'],
    reply: '您可以在「我的订单 → 订单详情 → 申请售后」中提交申请，支持仅退款、退货退款、换货三种类型，客服会在 30 分钟内受理～'
  },
  {
    keys: ['配送', '快递', '发货', '多久到', '运费', '配送费'],
    reply: '门店营业时间 08:00-22:00，一般下单后 45 分钟内送达；满 59 元免基础配送费（金卡会员满 49 元即可），20km 外暂不支持配送。'
  },
  {
    keys: ['优惠券', '券', '满减', '优惠'],
    reply: '您可以在「领券中心」领取优惠券，下单时系统会自动选择满减与优惠券的最优组合；领券成功也会收到消息通知哦～'
  },
  {
    keys: ['拼团', '成团', '开团'],
    reply: '拼团为 3 人成团，24 小时内未成团会自动原路退款；您可以把拼团分享给好友，分享还能获得积分奖励～'
  },
  {
    keys: ['积分', '签到'],
    reply: '每日签到、购物、评价、分享都可以获得积分，积分可在「我的积分」兑换优惠券和商品～'
  },
  {
    keys: ['会员', '等级', '成长值'],
    reply: '成长值越高会员等级越高，可享全场折扣、更低免配送费门槛、每月赠券等特权；在「会员中心」可以查看详细权益。'
  },
  {
    keys: ['地址', '修改地址'],
    reply: '您可以在「我的 → 收货地址」中新增或编辑地址，支持地图选点与默认地址设置。'
  },
  {
    keys: ['你好', '在吗', 'hi', 'hello'],
    reply: '您好，我是零食商城智能客服，很高兴为您服务～有任何问题都可以直接问我，也可以点击下方常见问题。'
  }
];

const FAQ = [
  '怎么申请退款？',
  '下单后多久能送到？',
  '优惠券怎么使用？',
  '拼团失败会退款吗？',
  '积分怎么获得？',
  '会员有什么权益？'
];

const DEFAULT_REPLY = '已收到您的问题，人工客服工作时间为 08:00-22:00。您也可以换个说法描述，或点击「转人工」，我们会尽快回复您～';

Page({
  data: {
    messages: [],
    inputValue: '',
    faq: FAQ,
    typing: false,
    scrollToId: '',
    showRate: false,
    speed: 5,
    solve: 5,
    rateText: ''
  },

  onLoad() {
    let history = [];
    try { history = wx.getStorageSync(HISTORY_KEY) || []; } catch (e) {}
    if (!history.length) {
      history = [{
        id: 'bot-welcome',
        role: 'bot',
        content: '您好，这里是零食商城客服中心 🎉 请问有什么可以帮您？',
        time: this.now()
      }];
    }
    this.setData({ messages: history }, () => this.scrollBottom());
  },

  now() {
    const d = new Date();
    const p = (n) => (n < 10 ? '0' + n : '' + n);
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  },

  saveHistory() {
    wx.setStorageSync(HISTORY_KEY, this.data.messages.slice(-50));
  },

  scrollBottom() {
    const list = this.data.messages;
    if (list.length) this.setData({ scrollToId: 'msg-' + list[list.length - 1].id });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendFaq(e) {
    this.sendText(e.currentTarget.dataset.text);
  },

  send() {
    this.sendText(this.data.inputValue);
  },

  sendText(content) {
    content = (content || '').trim();
    if (!content) return;
    const msg = { id: Date.now() + 'u', role: 'user', content, time: this.now() };
    this.setData({
      messages: this.data.messages.concat(msg),
      inputValue: '',
      typing: true
    }, () => {
      this.scrollBottom();
      this.saveHistory();
    });
    // 规则引擎回复（模拟网络延迟）
    setTimeout(() => {
      const reply = this.matchRule(content);
      const botMsg = { id: Date.now() + 'b', role: 'bot', content: reply, time: this.now() };
      this.setData({
        messages: this.data.messages.concat(botMsg),
        typing: false
      }, () => {
        this.scrollBottom();
        this.saveHistory();
      });
    }, 700 + Math.random() * 600);
  },

  matchRule(text) {
    const hit = RULES.find((r) => r.keys.some((k) => text.indexOf(k) !== -1));
    return hit ? hit.reply : DEFAULT_REPLY;
  },

  // 转人工（模拟）
  toHuman() {
    this.sendText('我要转人工客服');
  },

  // 问题已解决 → 评价
  solved() {
    this.setData({ showRate: true });
  },
  noop() {},
  setSpeed(e) {
    this.setData({ speed: Number(e.currentTarget.dataset.score) });
  },
  setSolve(e) {
    this.setData({ solve: Number(e.currentTarget.dataset.score) });
  },
  onRateInput(e) {
    this.setData({ rateText: e.detail.value });
  },
  submitRate() {
    serviceApi.rate({ speed: this.data.speed, solve: this.data.solve, content: this.data.rateText })
      .then(() => {
        toast.showSuccess('评价成功，积分 +5');
        this.setData({ showRate: false });
        const botMsg = {
          id: Date.now() + 'b',
          role: 'bot',
          content: '感谢您的评价，祝您购物愉快，欢迎再次光临零食商城～',
          time: this.now()
        };
        this.setData({ messages: this.data.messages.concat(botMsg) }, () => this.scrollBottom());
        this.saveHistory();
      });
  },

  clearHistory() {
    wx.removeStorageSync(HISTORY_KEY);
    this.onLoad();
  }
});
