// mock/data/messages.js —— 消息通知种子
// message: id, type(1系统 2订单 3促销 4互动), title, content, isRead, createTime,
//          relatedId, relatedType('order'|'coupon'|'group'|'goods'|null)

function daysAgo(n, h) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h || 10, 0, 0, 0);
  const p = x => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

module.exports = [
  { id: 1, type: 2, title: '订单配送中', content: '您的订单已由骑手取货，正在火速配送中，请保持电话畅通。', isRead: false, createTime: daysAgo(0, 7), relatedId: 3, relatedType: 'order' },
  { id: 2, type: 3, title: '限时抢购开抢啦', content: '每日 10 点限时抢购，薯片低至 9.9 元，先到先得！', isRead: false, createTime: daysAgo(0, 10), relatedId: 1, relatedType: 'seckill' },
  { id: 3, type: 1, title: '会员权益升级提醒', content: '亲爱的金卡会员，您本月已可领取 2 张专属优惠券，速去领券中心查看。', isRead: true, createTime: daysAgo(1, 9), relatedId: null, relatedType: 'coupon' },
  { id: 4, type: 4, title: '您的评价获得点赞', content: '您对「蜜汁猪肉脯」的评价获得了 5 个赞，继续分享优质评价可赚积分哦。', isRead: true, createTime: daysAgo(2, 14), relatedId: null, relatedType: null },
  { id: 5, type: 3, title: '满减阶梯活动进行中', content: '全场满 59 减 8、满 99 减 20、满 199 减 50，多买多省！', isRead: true, createTime: daysAgo(3, 10), relatedId: null, relatedType: null },
  { id: 6, type: 4, title: '拼团成功提醒', content: '您参与的「零食大礼包 30 包」拼团已成团，商品将尽快为您发出。', isRead: true, createTime: daysAgo(2, 18), relatedId: 3, relatedType: 'group' }
];
