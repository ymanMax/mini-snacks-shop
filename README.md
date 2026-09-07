# 零食商城小程序（原生微信小程序 + 全量本地 Mock）

围绕“零食商城”需求实现的原生小程序演示项目：红色主题 `#b4282d`，包含首页、分类、商品详情、购物车、订单全链路、会员/签到/积分、优惠券、拼团、搜索、收藏足迹、店铺、消息、地址等模块。**所有接口走本地 Mock，内存数据库 + Storage 持久化，下单/支付/拼团等均为模拟，不产生真实交易。**

## 一、快速开始

1. 微信开发者工具导入本目录；
2. AppID 使用测试号即可；
3. 无需后端，所有请求由 `mock/` 层在内存中处理（200~600ms 随机延迟，支付 2s）；
4. “我的 → 设置 → 清除缓存”可将全部演示数据恢复初始状态。

## 二、目录结构

```
├── app.js / app.json / app.wxss   全局入口（自动注入 Mock 用户、TabBar 角标、主题变量与通用类）
├── api/
│   ├── http.js                    统一请求入口（USE_MOCK 开关、拦截器、loading、错误提示、upload）
│   └── home/goods/cart/order/address/member/coupon/group/message/user/shop/collect/search.js
├── mock/
│   ├── index.js                   路由分发（method + url），全部业务写操作真实生效
│   ├── db.js                      内存数据库（wx.setStorageSync 持久化，schema 版本管理）
│   ├── delay.js / util.js
│   └── data/                      32 款商品、8 分类、购物车、地址、11 条订单、评价、
│                                  会员等级、签到、积分、优惠券、秒杀/满减、拼团、消息、店铺、用户
├── components/
│   ├── safe-image/                统一图片组件，binderror 自动回退 /static/images/default.png
│   ├── empty/                     空状态（插图+文案+按钮）
│   ├── skeleton/                  骨架屏（home/grid/list/detail/order/cart）
│   ├── goods-card/                商品卡片（双列/横向）
│   ├── stepper/                   数量步进器（受库存约束）
│   └── load-more/                 上拉加载状态
├── pages/
│   ├── index/            首页：搜索入口、轮播、8 分类、秒杀倒计时、主题、推荐分页、悬浮购物车
│   ├── classic/          分类：左导航 + 排序 + 筛选面板（价格区间/产地多选/仅看有货）
│   ├── detail/           详情：图文/视频切换、SKU 半屏弹层、评价、看了又看、收藏/足迹/分享
│   ├── cart/             购物车：全选、失效商品、编辑批量删除、优惠/运费试算、空态推荐
│   ├── order/
│   │   ├── confirm/      确认订单：地址、时段、优惠券、备注、支付方式、金额明细
│   │   ├── list/         订单列表：6 状态 Tab、分页、支付/取消/催发/收货/评价/再来一单
│   │   ├── detail/       订单详情：状态头、配送 timeline、骑手卡、模拟推进、全量操作
│   │   └── review/       订单评价：逐商品星级/标签/晒图 + 店铺三维评分（+20 积分）
│   ├── member/ center|checkin|points   会员卡与等级特权、月历签到、积分明细与兑换
│   ├── coupon/ coupon|mine             领券中心（满减/折扣/无门槛）、卡包与下单选券
│   ├── search/           搜索：历史（单删/清空）、热词、联想、排序结果分页
│   ├── collect/          收藏记录（左滑删除）与浏览足迹（按日期分组）
│   ├── seckill/          限时抢购场次页：每日 10/14/20 点三场、倒计时、抢购进度条、开抢提醒
│   ├── group/            拼团列表 + group/detail 拼团详情（开团/参团/邀请/模拟好友参团/
│   │                     成团奖励、超时自动退款）；商品详情含拼团与批发阶梯价批量加购
│   ├── service/chat/     客服会话：规则引擎自动回复、快捷问题、客服评价
│   ├── aftersale/        售后 apply/list/detail：仅退款/退货退款/换货、状态时间线、
│   │                     模拟商家处理、退款进度回写订单 timeline、售后评价
│   ├── address/          地址列表（家/学校/公司标签筛选）+ picker（逐地址运费预览/超范围拦截）
│   │                     + pick（模拟地图选点/定位 POI）
│   ├── order/slot/       配送日期与时段选择
│   ├── shop/             店铺主页/分项评分/公告/配送规则/门店照/店铺评价
│   ├── message/          消息中心：4 类通知、已读/全部已读
│   ├── address/ + newAddress/   地址管理与原生 region picker（距离用于运费演示）
│   ├── list/             主题商品列表
│   ├── orders/           旧订单页（自动重定向到新订单中心）
│   ├── fail/、logs/
├── static/
│   ├── images/           空态/默认图
│   └── mock/             商品图、分类、banner、主题、店铺、头像、logo、详情图、演示短视频
├── tools/gen_assets.py   本地静态资源生成脚本（PIL，渐变+中文）
└── utils/  format / toast / bus / constant / cart 等公共工具
```

## 三、数据约定

- 响应：`{ code: 200, data, msg }`；分页：`{ records, total, current, size, hasMore }`
- 金额：一律为数字（元，两位小数），前端用 `utils/format.formatPrice` 展示
- 订单状态：`1待付款 2待发货 3配送中 4待收货 5已完成 6已取消`
- 购物车/订单/优惠券/签到/积分等用户数据保存在 Storage 的 `snack_shop_db_v1`
- 联调真实后端：把 `api/http.js` 顶部 `USE_MOCK` 改为 `false` 并配置 `BASE_URL`，页面零改动

## 四、演示链路建议

首页分类/秒杀/推荐 → 详情选 SKU 加购或立即购买 → 购物车勾选试算运费/满减 → 选地址/优惠券下单 → Mock 支付 → 订单详情“模拟发货/送达” → 确认收货返积分 → 晒图评价再得 20 积分 → 签到/兑换/拼团/收藏/足迹。
