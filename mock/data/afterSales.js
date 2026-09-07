// mock/data/afterSales.js —— 售后工单初始数据（1 笔已完成的退款单演示）
const { offsetTime } = require('../util');

function buildInitialTickets(goodsList) {
  const g = goodsList.find((x) => x.id === 17);
  return [
    {
      id: 70001,
      orderId: 20008,
      orderNo: 'SN' + offsetTime(-8).slice(0, 10).replace(/-/g, '') + '0008',
      type: 1,
      typeText: '仅退款',
      reason: '商品临期，申请退款',
      items: [{
        goodsId: 17,
        name: g ? g.name : '三只松鼠手撕肉脯 100g',
        pic: g ? g.pic : '',
        specText: '标准装 · 原味',
        price: 18.9,
        count: 1
      }],
      amount: 18.9,
      status: 3,
      statusText: '已完成',
      timeline: [
        { time: offsetTime(-8, -2), status: '提交申请', remark: '仅退款：商品临期，申请退款' },
        { time: offsetTime(-8, -1), status: '商家受理', remark: '客服已核实情况' },
        { time: offsetTime(-7, -20), status: '退款完成', remark: '¥18.90 已原路退回' }
      ],
      rate: { speed: 5, solve: 5, content: '处理很快，当天就退款了' },
      refundStatus: '已原路退回 ¥18.90',
      createTime: offsetTime(-8, -2)
    }
  ];
}

module.exports = { buildInitialTickets };
