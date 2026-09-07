/**
 * 消息通知 Mock 数据（字段与 4.14 message 对齐 + link 跳转路由）
 * type：1系统 / 2订单 / 3促销 / 4互动
 * link：点击消息跳转的页面路由（消息中心按此路由表跳转，无 link 时按 type+relatedId 兜底）
 */
const { fmt } = require('../_time.js');

const TYPE_TEXT = { 1: '系统', 2: '订单', 3: '促销', 4: '互动' };

const messages = [
  { id: 1, type: 2, title: '订单已发货', content: '您的订单 SN20260901001 已由骑手取货，正在飞奔向您，预计 45 分钟内送达。', isRead: false, createTime: fmt(0, 'YYYY-MM-DD HH:mm'), relatedId: 5, link: '/pages/order/detail?id=5' },
  { id: 2, type: 3, title: '限时秒杀开启', content: '10 点场秒杀火热进行中：薯片 3.9 元、每日坚果 39.9 元，抢完即止！', isRead: false, createTime: fmt(-0.1, 'YYYY-MM-DD HH:mm'), relatedId: 1, link: '/pages/promotion/seckill' },
  { id: 3, type: 1, title: '会员日通知', content: '每月 8 号为会员日，金卡及以上会员积分双倍，专享折上折。', isRead: false, createTime: fmt(-1, 'YYYY-MM-DD HH:mm'), relatedId: null, link: '/pages/member/center/center' },
  { id: 4, type: 4, title: '评价有礼', content: '您有 2 笔订单待评价，完成评价可得 20 积分，带图评价 +30 积分。', isRead: true, createTime: fmt(-2, 'YYYY-MM-DD HH:mm'), relatedId: null, link: '/pages/order/list?status=7' },
  { id: 5, type: 2, title: '订单已完成', content: '您的订单 SN20260828001 已送达，感谢惠顾，欢迎再次光临。', isRead: true, createTime: fmt(-4, 'YYYY-MM-DD HH:mm'), relatedId: 8, link: '/pages/order/detail?id=8' },
  { id: 6, type: 3, title: '优惠券到账', content: '生日礼包已发放：满88减15优惠券 1 张，有效期至本月底。', isRead: true, createTime: fmt(-8, 'YYYY-MM-DD HH:mm'), relatedId: null, link: '/pages/coupon/coupon?tab=mine' },
  { id: 7, type: 1, title: '配送范围调整', content: '9 月起配送范围扩大至 60 公里，满 59 元依旧免基础配送费。', isRead: true, createTime: fmt(-15, 'YYYY-MM-DD HH:mm'), relatedId: null, link: '/pages/shop/shop?tab=delivery' },
  { id: 8, type: 2, title: '退款成功', content: '拼团未成团，订单 SN20260720003 已自动退款，预计 1-3 个工作日到账。', isRead: true, createTime: fmt(-30, 'YYYY-MM-DD HH:mm'), relatedId: 12, link: '/pages/order/detail?id=12' }
];

module.exports = { messages, TYPE_TEXT };
