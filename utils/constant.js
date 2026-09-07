// utils/constant.js —— 客户端业务常量（与 Mock 数据约定保持一致）

// 订单状态：1待付款 2待发货 3配送中 4待收货 5已完成 6已取消
const ORDER_STATUS = {
  1: { text: '待付款', color: '#b4282d' },
  2: { text: '待发货', color: '#ff9900' },
  3: { text: '配送中', color: '#2f7cf6' },
  4: { text: '待收货', color: '#0ea47a' },
  5: { text: '已完成', color: '#969799' },
  6: { text: '已取消', color: '#969799' }
}

const ORDER_TABS = [
  { status: 0, text: '全部' },
  { status: 1, text: '待付款' },
  { status: 2, text: '待发货' },
  { status: 3, text: '配送中' },
  { status: 4, text: '待收货' },
  { status: 5, text: '已完成' }
]

// 配送 timeline 状态
const TIMELINE_DONE = 1
const TIMELINE_CURRENT = 0
const TIMELINE_WAIT = -1

// 积分类型：1购物 2签到 3评价 4兑换消耗 5生日赠送 6分享/邀请
const POINT_TYPE = {
  1: '购物奖励',
  2: '签到奖励',
  3: '评价奖励',
  4: '积分兑换',
  5: '生日礼包',
  6: '分享奖励'
}

// 消息类型：1系统 2订单 3促销 4互动
const MESSAGE_TYPE = {
  1: { text: '系统通知', color: '#b4282d' },
  2: { text: '订单消息', color: '#2f7cf6' },
  3: { text: '促销活动', color: '#ff9900' },
  4: { text: '互动消息', color: '#0ea47a' }
}

const DEFAULT_IMG = '/static/images/default.png'

module.exports = {
  ORDER_STATUS: ORDER_STATUS,
  ORDER_TABS: ORDER_TABS,
  POINT_TYPE: POINT_TYPE,
  MESSAGE_TYPE: MESSAGE_TYPE,
  DEFAULT_IMG: DEFAULT_IMG
}
