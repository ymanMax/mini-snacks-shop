/**
 * 客服与售后 Mock 数据
 * - qaRules：客服会话规则引擎（关键词 → 预设回复）
 * - hotQuestions：常见问题快捷选项
 * - mapPois：地图选点 mock POI 列表
 * - tickets：售后工单种子（状态：1待审核/2处理中/3已完成/4已拒绝/5已撤销）
 */
const { fmt } = require('../_time.js');

const TYPE_TEXT = { 1: '仅退款', 2: '退货退款', 3: '换货' };
const STATUS_TEXT = { 1: '待审核', 2: '处理中', 3: '已完成', 4: '已拒绝', 5: '已撤销' };

const welcome = '您好，我是零食商城客服小零 🐿️～很高兴为您服务！您可以直接输入问题，或点击下方常见问题快捷咨询。';

const hotQuestions = [
  '配送要多久？怎么收费？',
  '怎么申请退款/售后？',
  '优惠券怎么使用？',
  '积分怎么获得和兑换？',
  '拼团失败了怎么办？',
  '秒杀几点开始？'
];

/** 规则引擎：按 keywords 命中顺序返回 answer（前端不感知，POST /service/reply 由 mock 匹配） */
const qaRules = [
  { keywords: ['配送', '运费', '免运费', '免配送', '多久', '送达', '骑手', '几点送'], answer: '配送说明：起步配送费 5 元（含 3 公里），超出部分 1 元/公里；单笔满 59 元免基础配送费（金卡 49 元、铂金/钻石 39 元）。营业时间 08:00-22:00，平均 45 分钟送达，可在订单详情查看骑手位置与配送进度～' },
  { keywords: ['退款', '退货', '换货', '售后', '退钱'], answer: '售后申请路径：「我的订单 → 订单详情 → 申请售后」，支持仅退款 / 退货退款 / 换货三种类型。提交后商家将在 24 小时内审核，审核通过后退款将于 1-3 个工作日原路退回；进度可在「我的 → 售后服务」工单列表中跟踪。' },
  { keywords: ['优惠券', '券', '满减', '折扣', '领券'], answer: '优惠券使用：领券中心可领取优惠券；结算时系统会自动推荐最优券，也可手动切换；满减阶梯（满59减8 / 满99减20 / 满199减50）无需领券、下单自动生效，购物车会提示"还差 xx 元"哦～' },
  { keywords: ['积分', '签到', '成长值', '会员', '等级', '兑换'], answer: '积分获取：购物 1 元 = 1 积分、每日签到 +5~+50（连签第 7 天大奖）、评价 +20（带图 +30）、分享 +5。积分可在「积分中心」兑换优惠券与实物；成长值决定会员等级（普通→银卡→金卡→铂金→钻石），等级越高折扣越大、免配送门槛越低。' },
  { keywords: ['拼团', '成团', '开团', '参团', '团购', '批发'], answer: '拼团规则：开团/参团后需邀请好友，达到成团人数即成团并安排配送；24 小时未成团将自动取消并全额退款（演示环境为即时模拟）。分享拼团可得积分，邀请新用户参团双方都得优惠券；团购批发买得越多单价越低，支持按阶梯数量批量加购。' },
  { keywords: ['秒杀', '抢购', '限时', '场次', '几点'], answer: '限时秒杀每天 10:00 开抢，抢完即止；您可以在秒杀场次页点击「提醒我」，开场前会通过消息中心通知您。' },
  { keywords: ['发票', '开票'], answer: '支持开具电子发票：订单完成后联系客服并提供抬头与税号，1-3 个工作日内开出并发送到您的邮箱。' },
  { keywords: ['新鲜', '日期', '保质期', '坏了', '破损', '漏气'], answer: '品质保障：全部零食产地直发，商品详情页标注生产日期；签收时请拍照验货，如有破损/漏气/临期问题，可在订单详情申请「坏损包赔」售后，我们会优先处理并补偿。' },
  { keywords: ['地址', '范围', '超出', '修改地址'], answer: '配送范围为门店周边 60 公里；超出范围的地址会提示"该地址暂不支持配送"。下单前可在「收货地址」中修改或新增地址；订单支付后地址不可修改，可联系客服协助拦截。' },
  { keywords: ['支付', '付款', '微信支付', '货到付款'], answer: '支持微信支付与货到付款两种方式（当前为演示环境，支付为 Mock 流程，不产生真实交易）。待付款订单可随时取消，优惠券将自动退回。' },
  { keywords: ['你好', '您好', '在吗', 'hi', 'hello'], answer: '您好呀～我是客服小零 🐿️，请问有什么可以帮您？可以问我配送、售后、优惠券、积分、拼团、秒杀等问题。' }
];

const defaultAnswer = '已收到您的问题～客服小零正在为您确认，请稍等。您也可以换个关键词提问（如：配送 / 退款 / 优惠券 / 积分 / 拼团 / 秒杀），或拨打客服热线 400-800-8888（08:00-22:00）。';

/** 地图选点 mock：预设 POI（新增/编辑地址"地图选点/定位"用） */
const mapPois = [
  { id: 1, name: '数字大厦', district: '南山区', detail: '科技园南区数字大厦 8 栋', distanceKm: 2.4 },
  { id: 2, name: '深圳湾科技生态园', district: '南山区', detail: '高新南十道深圳湾科技生态园 2 栋', distanceKm: 4.1 },
  { id: 3, name: '天安云谷', district: '龙岗区', detail: '坂田街道天安云谷 2 期 5 栋', distanceKm: 12.5 },
  { id: 4, name: '壹方城', district: '宝安区', detail: '新湖路壹方城中心 L3', distanceKm: 18.3 },
  { id: 5, name: '大运软件小镇', district: '龙岗区', detail: '龙岗大道大运软件小镇 12 栋', distanceKm: 25.7 },
  { id: 6, name: '坪山创新广场', district: '坪山区', detail: '坪山大道创新广场 A 座', distanceKm: 41.2 },
  { id: 7, name: '大鹏海滨公寓', district: '大鹏新区', detail: '鹏飞路海滨公寓 6 栋', distanceKm: 58.9 },
  { id: 8, name: '惠阳淡水商贸城', district: '惠阳区（惠州市）', detail: '淡水街道商贸城 3 栋', distanceKm: 66.5 }
];

/** 售后原因（按类型） */
const aftersaleReasons = {
  1: ['不想要了', '拍错/多拍', '未收到货', '商品破损', '配送太慢'],
  2: ['质量问题', '与描述不符', '包装破损', '收到错货', '口感不佳'],
  3: ['规格拍错', '包装破损', '商品瑕疵']
};

/** 售后工单种子（结合订单数据） */
const tickets = [
  {
    id: 1, orderId: 10, orderNo: 'SN20260810003',
    goodsName: '泰国芒果干 无添加', goodsPic: '/static/mock/goods-13.png',
    type: 1, reason: '商品破损', desc: '收到时有两袋漏气，希望退款。',
    images: ['/static/mock/goods-13.png'],
    status: 2, refundAmount: 13.9,
    createTime: fmt(-2, 'YYYY-MM-DD HH:mm'),
    timeline: [
      { time: fmt(-2, 'YYYY-MM-DD HH:mm'), status: 1, statusText: '待审核', remark: '售后申请已提交，等待商家审核' },
      { time: fmt(-1.8, 'YYYY-MM-DD HH:mm'), status: 2, statusText: '处理中', remark: '商家已同意退款，正在为您办理' }
    ]
  },
  {
    id: 2, orderId: 11, orderNo: 'SN20260801001',
    goodsName: '纸皮核桃 新疆原味', goodsPic: '/static/mock/goods-13.png',
    type: 3, reason: '规格拍错', desc: '拍成 5 斤装了，想换 3 斤装。',
    images: [],
    status: 3, refundAmount: 0,
    createTime: fmt(-10, 'YYYY-MM-DD HH:mm'),
    timeline: [
      { time: fmt(-10, 'YYYY-MM-DD HH:mm'), status: 1, statusText: '待审核', remark: '售后申请已提交' },
      { time: fmt(-9.8, 'YYYY-MM-DD HH:mm'), status: 2, statusText: '处理中', remark: '商家已同意换货，等待寄回' },
      { time: fmt(-8, 'YYYY-MM-DD HH:mm'), status: 3, statusText: '已完成', remark: '换货商品已发出，请注意查收' }
    ]
  }
];

/** 客服评价种子 */
const serviceReviews = [
  { id: 1, speed: 5, solve: 5, content: '客服响应很快，售后处理也利索！', createTime: fmt(-8, 'YYYY-MM-DD HH:mm') }
];

module.exports = {
  TYPE_TEXT, STATUS_TEXT, welcome, hotQuestions, qaRules, defaultAnswer,
  mapPois, aftersaleReasons, tickets, serviceReviews
};
