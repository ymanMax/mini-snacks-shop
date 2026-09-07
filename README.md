# 零食商城微信小程序（Mock 全功能版）

原生微信小程序零食商城，**全站通过 `api/http.js` 的 `USE_MOCK` 开关在 Mock 内存服务与真实后端间一键切换**。
所有写操作（加购、下单、支付、评价、签到、领券、拼团等）在 Mock 内存库中真实生效，并结合 `wx.storage` 持久化，可完整演示「浏览 → 加购 → 下单 → 支付 → 配送 → 评价」交易闭环。

> 演示环境，所有金额与支付均为模拟，不产生真实交易。

## 目录结构

```
├── api/
│   ├── http.js            # 统一请求入口（const USE_MOCK = true，拦截器/loading/错误处理）
│   └── index.js           # 全站接口定义（页面只允许从这里取数）
├── mock/
│   ├── index.js           # Mock 总入口：按 url + method 路由分发，统一 { code, data, msg }
│   ├── delay.js           # 随机 200~600ms 网络延迟
│   ├── store.js           # 内存数据库 + wx.storage 持久化 + 首次播种
│   ├── util.js            # 分页/时间/金额工具
│   └── data/              # 16 个数据模块（goods 32 条、orders 覆盖全状态等）
├── components/            # safe-image / goods-card / empty / loading-more
├── pages/
│   ├── index/  classic/  cart/  mine/  detail/  list/  search/
│   ├── order/  confirm|list|detail|review      # 订单全链路
│   ├── member/ center|checkin|points           # 会员/签到/积分
│   ├── coupon/ center|mine
│   ├── favorite/        # 收藏 & 足迹（type 区分）
│   ├── group/ promotion/ message/ shop/
│   └── address/ newAddress/ orders(兼容跳转) logs/ fail/
├── static/
│   ├── mock/              # 离线占位图 63 张 + 演示视频 2 个（<1MB）
│   └── images/default.png # 图片加载失败兜底
└── utils/  format.js(金额) format.wxs(WXML用) toast.js area.js util.js
```

## 联调真实后端

打开 `api/http.js`，将 `const USE_MOCK = true` 改为 `false`，并在 `BASE_URL` 配置后端地址即可；
约定响应结构 `{ code: 200, data, msg }`，分页结构 `{ records, total, current, size, pages }`，
接口路径以 `mock/index.js` 路由表为准。

## 核心功能

- **首页**：搜索栏、轮播、金刚区、限时抢购倒计时、主题、分页新品、骨架屏/空态、悬浮购物车角标
- **分类**：8 分类导航、综合/销量/价格排序、价格区间+产地+有货筛选面板、分页
- **详情**：多图/视频切换、图片预览、半屏 SKU（规格联动价格库存）、评价预览/全部、收藏、看了又看、足迹、分享
- **购物车**：修复全选总价 bug、失效商品折叠、编辑批量删除、满减/运费实时试算、空态推荐
- **订单**：确认页（地址/时段/优惠券/备注/运费规则）、列表状态 Tab、详情 timeline+骑手、模拟支付、模拟配送推进、评价（+20 积分）、再来一单
- **会员**：五级成长体系、生日礼包、每日签到（7 天梯度奖励）、积分明细与兑换、优惠券（领券/持券/满减折扣无门槛）
- **营销**：限时抢购场次（多场次倒计时/进度条/立即抢购）、满减阶梯（购物车自动计算+凑单提示）、团购批发阶梯价批量加购、3 人拼团（开团/参团/邀请/成团/未成团自动退款）、分享赚积分、邀新得券、消息中心（持久化+路由跳转）
- **客服售后**：智能客服会话（规则引擎+FAQ+历史+客服评价）、申请售后（仅退款/退货退款/换货）、售后工单列表与状态跟踪
- **配送**：地址标签筛选、mock 地图选点/定位、下单页地址选择器逐地址试算运费、尽快/预约时段、超 20km 不支持配送拦截
- **全局**：红色主题 #b4282d、统一骨架屏/空态/Toast/金额格式化、所有图片 binderror 回退默认图
