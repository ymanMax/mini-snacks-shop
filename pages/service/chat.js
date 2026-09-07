// pages/service/chat.js —— 客服会话页（mock 自动回复 + 常见问题 + 客服评价）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    loading: true,
    faqs: [],
    chats: [],          // { role: 'service'|'user', text }
    scrollInto: '',
    inputValue: '',
    answering: false,   // 对方正在输入...
    userRounds: 0,      // 用户已发送轮数（>=2 后自动弹出评价卡片）
    // 评价
    showRate: false,
    rated: false,
    speed: 5,
    satisfaction: 5,
    submittingRate: false
  },

  onLoad() {
    api.getServiceFaq().then(res => {
      this.setData({
        faqs: res.faqs || [],
        chats: [{ role: 'service', text: res.greeting || '您好，我是零食商城客服小零，很高兴为您服务～' }]
      });
      this.scrollToBottom();
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false });
    });
  },

  scrollToBottom(anchor) {
    setTimeout(() => {
      this.setData({ scrollInto: anchor || ('chat-' + (this.data.chats.length - 1)) });
    }, 100);
  },

  // ===== 发送消息 =====
  sendMessage(content) {
    const text = String(content || '').trim();
    if (!text || this.data.answering) return;
    const chats = this.data.chats.concat([{ role: 'user', text }]);
    this.setData({
      chats,
      inputValue: '',
      answering: true,
      userRounds: this.data.userRounds + 1
    });
    this.scrollToBottom('typing');
    // 模拟客服打字中，500ms 后回复
    setTimeout(() => {
      api.askService(text).then(res => {
        this.setData({
          chats: this.data.chats.concat([{ role: 'service', text: res.reply }]),
          answering: false
        });
        // 发送 2 轮消息后在会话尾部展示评价卡片
        if (this.data.userRounds >= 2 && !this.data.rated && !this.data.showRate) {
          this.setData({ showRate: true });
          this.scrollToBottom('rate-card');
        } else {
          this.scrollToBottom();
        }
      }).catch(() => {
        this.setData({ answering: false });
      });
    }, 500);
  },

  tapFaq(e) {
    const item = this.data.faqs[e.currentTarget.dataset.index];
    if (item) this.sendMessage(item.q);
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onSend() {
    this.sendMessage(this.data.inputValue);
  },

  // ===== 客服评价 =====
  openRate() {
    if (this.data.rated) {
      toast.showToast('您已完成本次评价');
      return;
    }
    this.setData({ showRate: true });
    this.scrollToBottom('rate-card');
  },

  setSpeed(e) {
    this.setData({ speed: Number(e.currentTarget.dataset.v) });
  },

  setSatisfaction(e) {
    this.setData({ satisfaction: Number(e.currentTarget.dataset.v) });
  },

  submitRate() {
    if (this.data.submittingRate || this.data.rated) return;
    this.setData({ submittingRate: true });
    api.rateService({
      speed: this.data.speed,
      satisfaction: this.data.satisfaction,
      content: ''
    }).then(() => {
      toast.success('感谢评价，+5 积分');
      this.setData({ rated: true });
      this.scrollToBottom('rate-card');
    }).catch(() => {}).finally(() => {
      this.setData({ submittingRate: false });
    });
  }
});
