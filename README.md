# 零食商城购物微信小程序（V1.0 优化版）

基于微信原生框架的零食商城完整 Demo。本版本完成 10 项优化：统一 Mock 数据体系、API 收口、首页/分类/详情体验升级、购物车逻辑修复、订单全链路、会员积分体系、全局设计规范、搜索与收藏足迹系统。

> 演示环境，不产生真实交易。游客无需登录即可体验全部功能（onLaunch 自动注入 Mock 用户）。

## 快速开始

1. 微信开发者工具导入本目录
2. 直接编译运行，无需任何配置
3. 联调真实后端：将 `api/http.js` 顶部 `USE_MOCK` 改为 `false`，并配置 `BASE_URL`

## 架构说明

```
mini-snacks-shop/
├── api/
│   ├── http.js           # 统一请求入口（USE_MOCK 开关、拦截器、错误处理、loading）
│   └── index.js          # 50+ 业务接口函数，页面唯一取数来源
├── mock/
│   ├── index.js          # Mock 路由分发（url + method 匹配）+ 内存数据库
│   ├── delay.js          # 200~600ms 随机网络延迟
│   └── data/             # 16 个数据文件：goods(30+)/categories(8)/carts/addresses/
│                         # orders(11)/reviews(22)/shopReviews/members/points/checkin/
│                         # coupons/promotions/groups/messages/user/shop
├── utils/
│   ├── toast.js          # 统一 Toast/Loading/Confirm 封装
│   ├── format.js         # 金额与时间格式化（金额运算走 mul/add，杜绝字符串价格）
│   ├── format.wxs        # WXML 共享格式化（价格两位小数、销量过万）
│   └── area.js           # 省市区数据
├── static/
│   ├── images/default.png  # 全局图片兜底（所有 image 均 binderror 回退）
│   └── mock/             # 40+ 张本地占位图（离线可用，无外链裂图风险）
└── pages/                # 27 个页面（见下）
```

## 数据约定

- 接口统一返回 `{ code, data, msg }`，分页返回 `{ records, total, current, size }`
- 分页参数 `{ current, size, keywords, ... }`，每页 10 条
- 金额统一为数字（元，两位小数），前端用 `formatPrice` 渲染
- 写操作（加购/下单/支付/签到/领券/兑换/评价/收藏/足迹）内存真实生效 + `wx.setStorageSync` 持久化，跨页面一致
- 订单状态：1 待付款 / 2 待发货 / 3 配送中 / 4 待收货 / 5 已完成 / 6 已取消（列表另有 7 = 待评价）

## 页面清单

| 分类 | 页面 |
|---|---|
| Tab 页 | 首页 index / 分类 classic / 购物车 cart / 我的 mine |
| 商品 | 详情 detail（SKU/视频/评价/收藏/看了又看）、主题列表 list、搜索 search |
| 订单 | 确认订单 order/confirm、订单列表 order/list、订单详情 order/detail（配送 timeline/骑手/模拟进度）、订单评价 order/review、旧 orders（兼容重定向） |
| 会员 | 会员中心 member/center、每日签到 member/checkin、积分中心 member/points |
| 营销 | 领券中心 coupon/center、我的拼团 group/list |
| 用户 | 收藏记录 user/collect、浏览足迹 user/footprint、收货地址 address、新建地址 newAddress |
| 店铺 | 店铺主页 shop/index（评分/公告/配送规则/店铺评价） |
| 其他 | 消息中心 message/list、关于 about、设置 setting、日志 logs、失败页 fail |

## 核心功能

- **交易闭环**：浏览 → 搜索/筛选 → 详情（SKU/视频）→ 加购 → 结算（券/运费试算）→ Mock 支付（2s loading）→ 配送 timeline 推进 → 确认收货 → 评价（+20 积分）→ 再来一单
- **会员体系**：五级成长（普通→钻石）、成长值进度、生日月礼包、每日签到（7 天循环奖励）、积分明细与兑换专区
- **营销玩法**：限时抢购（倒计时+抢购进度）、满减阶梯（59-8/99-20/199-50）、优惠券（满减/折扣/无门槛）、拼团（成团进度/倒计时）、团购批发阶梯价
- **留存功能**：商品收藏（跨页同步）、浏览足迹（按日分组）、搜索历史（15 条）/热门搜索/联想、消息中心（订单/促销/系统/互动）

## 设计规范

- 主题色 `#b4282d`（价格/主按钮/选中态/角标），页面背景 `#f5f6f7`，卡片白底圆角 16rpx，间距 24rpx 基准
- 全局复用类见 `app.wxss`（卡片/标签/空态/骨架屏/角标/价格）
- 列表页统一：骨架屏首屏 + 空态插图 + 上拉分页 + 下拉刷新

## 技术红线（已落实）

- 原生导航栏 + 4 Tab 结构不变；无第三方 UI 库（日历/进度条均纯 CSS/WXML）
- 页面取数仅走 `api/index.js`，无 `wx.request` 直连、无散装 mock 引用
- 图片全部本地化 + `binderror` 兜底；视频 `binderror` 自动隐藏入口

详细页面开发约定见 [CONTRACT.md](./CONTRACT.md)。

---

## V1.1 延伸优化（2026-09-07）

- **优惠券与促销闭环**：限时抢购场次页（进行中/即将开始/已结束三态+倒计时+抢购进度条）；商品详情领券条（半屏券列表即领即用）；购物车最优券智能推荐（防抖触发）；结算页自动勾选最优券；满减阶梯凑单提示
- **地址与配送体验**：地址标签筛选（家/公司/学校）、默认地址置顶、模拟定位选点（POI 回填+距离生成）、地址级配送费实时预览、超 5km 配送范围拦截与提示
- **消息通知中心**：类型分组 Tab（系统/订单/促销/互动）、relatedType 路由跳转（订单/优惠券/拼团/售后/秒杀）、领券成功等促销触发消息
- **客服与售后**：智能客服会话页（关键词规则引擎+FAQ 快捷提问+打字中动效）、客服评价（+5 积分）、订单申请售后（仅退款/退货退款/换货+凭证上传）、售后工单状态跟踪（时间线+演示推进+撤销）
- **拼团与社交裂变**：拼团详情页（成团进度/成员头像/倒计时）、开团/参团下单支付全流程、我的拼团/可参团列表、分享得积分（每日限 3 次）、邀请有礼双方得券（inviteBy 启动参数）、团购批发阶梯价批量加购

新增路由：`pages/seckill/index`、`pages/group/detail`、`pages/service/chat`、`pages/service/apply`、`pages/service/aftersale`
