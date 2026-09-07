# API 契约与开发规范（所有页面开发必读）

> 本文档是全站数据层契约。所有页面**只允许**通过 `api/index.js`（或兜底 `api/http.js`）取数；
> 禁止页面直接 `require` mock 文件、禁止硬编码 `wx.request`。
> 联调真实后端时只需将 `api/http.js` 顶部 `USE_MOCK` 改为 `false`。

## 1. 响应约定

- 所有接口 resolve `{ code: 200, data, msg }`；`code !== 200` 时 http 层自动 toast 错误并 reject（可用 `{ showError: false }` 关闭）。
- 分页接口 `data = { records: [], total, current, size }`；分页入参 `{ current, size, ... }`（current 从 1 开始，size 默认 10）。
- 所有请求带 200~600ms 随机 mock 延迟；列表页首次加载用骨架屏，写操作用 `loading: true` 或页面级 loading。
- 金额一律为**数字**（元，两位小数）。展示统一用 `utils/format.wxs` 的 `fmt.formatPrice(x)`（输出 `￥xx.xx`）或 `fmt.priceNum(x)`（输出 `xx.xx`，外面自己拼 ￥ 符号）；JS 侧用 `utils/format.js`。禁止字符串价格参与计算。

## 2. 页面通用规范

- 页面背景 `#f5f6f7`；卡片白底圆角 `16rpx`；间距 `24rpx`；主题色 `#b4282d`（价格/主按钮/选中态/角标）。app.wxss 已提供工具类：`.card .price .price-origin .tag .btn-primary .btn-plain .btn-gray .btn-mini .badge .ellipsis .ellipsis-2 .flex-between .section-title .load-more .popup-mask .popup-bottom .safe-bottom .footer-placeholder .demo-tip` 等，优先复用。
- 所有 `<image>` 必须 `binderror` 回退 `/static/images/default.png`（用 data-fallback 或页面方法均可）。
- 空态统一用组件 `<empty-state text="..." btn-text="..." bind:action="..." />`；骨架屏用 `<skeleton type="goods|list|order|detail" />`；星级用 `<star-rate value size readonly bind:change />`；商品卡用 `<goods-card goods mode="grid|row|mini" bind:added />`（内部已处理跳详情、默认规格加购、角标刷新）。
- 分页：`onReachBottom` 加载下一页（`current+1`，`records.length >= total` 时显示"没有更多了"），`onPullDownRefresh` 重置 `current=1` 后 `wx.stopPullDownRefresh()`。页面 json 需要时加 `"enablePullDownRefresh": true`。
- toast/loading 统一走 `utils/toast.js`：`showToast(title, icon)` / `showSuccess` / `showError` / `showLoading(title)` / `hideLoading()` / `confirm(content, title) → Promise<boolean>`。
- 页面返回刷新：`onShow` 中重查数据（购物车角标、收藏态、订单状态）。
- 涉及金钱的支付处标注文案："演示环境，不产生真实交易"。
- 导航跳转商品详情统一：`/pages/detail/detail?id=商品id`（detail 页同时兼容 `product_id` 参数）。

## 3. 全局状态（app.js）

```js
const app = getApp();
app.globalData.cartCount        // 购物车数量（角标）
app.globalData.userInfo         // Mock 用户（onLaunch 已自动注入，永不为 null，除非用户主动退出）
app.refreshCartBadge()          // 加购/删购/下单后调用 → 更新 tabBar 角标 + globalData + 广播 'cartChange'
app.refreshUnreadMessage()      // 消息已读后调用
app.on('cartChange', cb) / app.off(...)   // 事件总线（悬浮购物车角标等跨页面同步用）
app.getUserInfo() / app.setUserInfo(u) / app.logout()
```

TabBar 角标（购物车 tab index=2）由 `refreshCartBadge()` 统一维护，页面不要直接调 `wx.setTabBarBadge`。

## 4. 接口清单（api/index.js）

以下 `api.xxx.yyy(...)` 返回 Promise，resolve 完整响应体 `{code,data,msg}`，业务数据在 `res.data`。

### 首页/商品
| 调用 | 参数 | data |
|---|---|---|
| `api.home.banners()` | - | `[{id,name,pic,description,linkGoodsId}]` |
| `api.home.themes()` | - | `[{id,name,description,topic_img,products:[id],goodsList:[goods]}]` |
| `api.home.themeDetail(id)` | 主题id | 同上单个 |
| `api.category.list()` | - | `[{id,name,icon,image,description}]`（8个） |
| `api.goods.page(p)` | `{current,size,categoryId,keywords,sort,minPrice,maxPrice,origins,inStock,themeId}` sort: `comprehensive/priceAsc/priceDesc/sales`；origins 数组或逗号串；inStock true | 分页 goods |
| `api.goods.detail(id)` | - | goods（含 isCollect；自动 +viewCount） |
| `api.goods.recommend(id)` | - | `[goods×6]` 看了又看 |
| `api.goods.guess()` | - | `[goods×10]` 猜你喜欢 |

goods 结构：`{id,name,pic,pics[5],videoUrl?,videoCover?,videoIntro?,categoryId,categoryName,minPrice,originalPrice,numberSells,stock,unit,origin,tags[],specs:[{name,values:[{label,price?,stock?,pic?}]}],description,detailImages[3],viewCount,collectCount,isCollect,hot,hotScore,memberPrice?}`

### 搜索
`api.search.hot()` → `[关键词]`；`api.search.suggest(keywords)` → `[{id,name,pic,price}]`；`api.search.history()` → `[str≤15]`；`addHistory(kw)` / `deleteHistory(kw)` / `clearHistory()`。

### 收藏/足迹
`api.collect.toggle(goodsId)` → `{isCollect,collectCount}`；`api.collect.page({current,size})` → 分页 goods；`api.collect.footprintAdd(goodsId)`（详情页 onLoad 调用，静默）；`api.collect.footprintList()` → `[{date:'YYYY-MM-DD',goods:[goods]}]`；`api.collect.footprintClear()`。

### 购物车
| 调用 | data |
|---|---|
| `api.cart.list()` | `{items:[cartItem], summary:{totalCount,validCount,invalidCount,checkedCount,checkedAmount,allChecked,fullReduce}}` |
| `api.cart.count()` | `{count}`（角标） |
| `api.cart.add({goodsId,specText,price,count,name?,pic?,stock?})` | 同 list（同 goodsId+specText+price 自动合并） |
| `api.cart.update({id,count?,checked?})` | 同 list |
| `api.cart.checkAll(checked)` | 同 list |
| `api.cart.remove(ids数组)` | 同 list |
| `api.cart.clearInvalid()` | 同 list |

cartItem：`{id,goodsId,name,pic,specText,price,count,checked,stock,invalid}`。**金额计算直接用 summary，不要在页面重复实现（页面自行计算时必须遍历 items 且仅 `!invalid` 参与）。**

### 地址
`api.address.list()` → `[address]`（默认地址排最前）；`api.address.default()`；`api.address.detail(id)`；`api.address.save({id?,name,phone,province,city,district,detail,tag,isDefault,distanceKm?})` → 全量列表；`api.address.remove(id)` → 列表；`api.address.setDefault(id)` → 列表。
address：`{id,name,phone,province,city,district,detail,tag(家/学校/公司),isDefault,distanceKm}`

### 订单
| 调用 | 说明 |
|---|---|
| `api.order.preview(p)` | 结算预览。`{fromCart:true}` 或 `{items,addressId,couponId}` → `{items,totalAmount,couponDiscount,freight,payAmount,fullReduce,address,coupon}` |
| `api.order.create(p)` | `{fromCart:true}`（购物车结算，自动移除已购项）或 `{items:[{goodsId,name,pic,specText,price,count}],addressId,couponId,remark,deliveryDate,deliverySlot,payType}` → order（status=1 待付款） |
| `api.order.page({current,size,status})` | status: 0全部/1待付款/2待发货/3配送中/4待收货/5已完成/6已取消/**7待评价** → 分页 order（附 statusText） |
| `api.order.detail(id)` | order + statusText + demoTip |
| `api.order.statusCount()` | `{s1,s2,s3,s4,s5,review}`（我的页角标） |
| `api.order.pay(id)` | 1→2。页面侧：点击支付 → `showLoading('支付中...')` 2 秒 → 调本接口 → 成功回调 |
| `api.order.cancel(id)` | 1/2 → 6，自动退券 |
| `api.order.confirm(id)` | 3/4 → 5，赠积分+成长值（可能触发升级） |
| `api.order.advance(id)` | 模拟配送进度演示：2→3→4→5 逐次推进，写 timeline + 消息 |
| `api.order.rebuy(id)` | 再来一单：商品重新加入购物车 → cartSummary |

order：`{id,orderNo,status,items:[{goodsId,name,pic,specText,price,count}],totalAmount,discountAmount,freight,payAmount,couponId,couponTitle,payType(1微信/2货到付款),remark,deliveryDate,deliverySlot,addressSnapshot:{name,phone,full,tag},rider:{name,phone,avatar}?|null,isReviewed,createTime,timeline:[{time,status,remark}]}`

### 评价
`api.review.goodsSummary(goodsId)` → `{avgScore,total,goodRate,tags:[{tag,count}],tagPool}`；`api.review.goodsPage({goodsId,current,size})` → 分页 review；`api.review.submitGoods({orderId,goodsId,score,tags[],content,images[]})` → `{points}`（自动 +20 分，带图 +30，订单标记已评价）；`api.review.shopPage({current,size})` → 分页 shopReview + `data.summary{fresh,speed,package,total}`；`api.review.submitShop({orderId,scores:{fresh,speed,package},content})`。
review：`{id,orderId,goodsId,userId,userName,avatar,score,tags,content,images,createTime}`

### 用户/会员
`api.user.info()` → user（`{id,nickName,avatar,phone,level,levelName,levelIcon,points,growthValue,birthday,couponCount,collectCount,footprintCount,unreadMessages}`）；`api.user.login()` → user；`api.user.logout()`；`api.user.updateAvatar()`（无参时循环换本地头像）。
`api.member.info()` → `{level,levelName,levelIcon,growthValue,nextLevelGrowth,progress(0-100),points,validDate,discountText,freeShipThreshold,privileges[],birthday:{isBirthdayMonth,received,gifts}}`；`api.member.levels()` → `{levels:[5级配置],currentLevel,growthValue}`；`api.member.receiveBirthday()`（生日月可领）。

### 签到/积分
`api.checkin.info()` → `{continuousDays,todaySigned,monthRecords:[日],year,monthNum,daysInMonth,today,rewards:[5,5,10,10,15,20,50],nextReward,totalPoints,rules}`；`api.checkin.sign()` → `{points,continuousDays,todaySigned,monthRecords,totalPoints}`（重复签到会 fail 并 toast）。
`api.points.page({current,size})` → 分页 pointsRecord + `data.totalPoints` + `data.typeText`；`api.points.exchangeList()` → `{goods:[{id,name,pic,points,stock,type,desc}],totalPoints,rules}`；`api.points.exchange(id)` → `{ok,totalPoints,msg}`。

### 优惠券
`api.coupon.available()` → 可领模板（含 received 标记）；`api.coupon.mine(status)` → 我的券（status: 0全部/1未使用/2已使用/3已过期）；`api.coupon.usable(amount)` → 结算可用券；`api.coupon.receive(id)`。
coupon：`{id,couponId,name,type(1满减/2折扣/3无门槛),threshold,discount(折扣券88=8.8折),scope,status,expireTime,source}`

### 促销/拼团/消息/店铺
`api.promotion.current()` → `[秒杀(含 goodsList、remainSeconds), 满减(fullReduceRules)]`；
`api.group.list()` → `{groups:[groupBuy+remainSeconds],wholesales:[{id,goodsId,title,pic,ladder:[{count,price}]}]}`；`api.group.detail(id)`；`api.group.mine()`；`api.group.join(id)`；
`api.message.list(type)` → `[message+typeText]`（type 0全部/1系统/2订单/3促销/4互动）；`api.message.unread()` → `{count}`；`api.message.read(id)`；`api.message.readAll()`；
`api.shop.info()` → shop（含 deliveryRule、deliveryText、photos、subScores、shopReviewSummary）；`api.shop.freight({addressId或distanceKm, amount})` → `{freight,rule,freeThreshold,deliveryText}`。

## 5. Storage 键约定（不要自造键名）

| key | 内容 |
|---|---|
| `userInfo` | Mock 用户（app.js onLaunch 自动注入） |
| `mock_carts` / `mock_addresses` / `mock_orders` / `mock_reviews` / `mock_shop_reviews` / `mock_user` / `mock_points` / `mock_checkin` / `mock_coupons` / `mock_groups` / `mock_messages` / `mock_collects` / `mock_footprints` / `mock_search_history` | mock 持久化数据（由 mock/index.js 统一管理，页面不要直接读写） |

调试：`api.debug.reset()` 可清空全部 mock 持久化数据恢复种子态。

## 6. 静态资源

- 商品/店铺/头像图：`/static/mock/goods-1..18.png`、`banner-1..3.png`、`theme-1..3.png`、`cat-1..8.png`、`shop-1..3.png`、`avatar-1..6.png`
- 默认兜底图：`/static/images/default.png`；用户头像：`/static/images/avatar.png`
- 旧 `image/` 目录仅保留 TabBar 图标、加购/删除/空态图（cry.png）等
- 视频源为公网 mp4，`<video>` 必须 `binderror` 隐藏视频 Tab

---

# V1.1 扩展契约（促销落地 / 地址配送 / 消息跳转 / 客服售后 / 拼团裂变）

## 7. 新增接口（均已实现并通过冒烟测试）

### 购物车促销提示（优化1-5）
`api.cart.list()` / 所有购物车写操作的 `summary` 新增 `promo` 字段：
```js
summary.promo = {
  nextTier: { threshold: 199, reduce: 50, diff: 43.06 } | null, // 下一档满减：还差 diff 元享满 threshold 减 reduce；null=已享最高档
  freeShipDiff: 0,          // >0 表示"还差 xx 元免基础配送费"（0=已免）
  freeThreshold: 49,        // 当前会员等级免配送门槛
  usableCouponCount: 3,     // 当前勾选金额可用券数量
  bestCoupon: coupon & { cutAmount: 15 } | null // 自动最优券（减免最大）
}
```
购物车提示文案建议："还差 ￥{diff} 享满 {threshold} 减 {reduce}"、"还差 ￥{freeShipDiff} 免配送费"、"{usableCouponCount} 张券可用，最优可省 ￥{bestCoupon.cutAmount}"。

### 优惠券
`api.coupon.best(amount)` → 最优券对象（含 cutAmount）或 null。

### 订单预览（优化2）
`api.order.preview(p)` 返回新增：`outOfRange`（bool，地址超出 60km 配送范围）、`maxKm`、`bestCoupon`（未手动选券时结算页应默认选中最优券）。`api.order.create` 对超范围地址直接失败："该地址暂不支持配送，请更换地址"。

### 地址（优化2）
- `api.address.list()` / `default()` 每条地址附 `outOfRange`（bool）
- `api.address.mapPois()` → `{ pois: [{id,name,district,detail,distanceKm}], maxKm }`（地图选点/定位 mock：新增地址页"地图选点"按钮弹出 POI 列表选择后回填 district/detail/distanceKm）
- `api.shop.freight({addressId|distanceKm, amount})` 返回附 `outOfRange`

### 促销（优化1）
`api.promotion.current()` → `[秒杀促销(含 goodsList:[{goodsId,name,pic,unit,seckillPrice,originalPrice,stock,sold,soldPercent}], remainSeconds), 满减促销]`；
`api.promotion.remind(id)` → 写入"秒杀开场提醒"消息（消息中心可见）。

### 拼团（优化5）
- `api.group.create({goodsId, specText?, count?})` → `{group, order}`：开团（本人为团长，3人团，24h 截止，groupPrice=minPrice×0.85）并生成待付款拼团订单
- `api.group.join({id, specText?, count?})` → `{group, order, msg}`：**返回结构已变更（旧版直接返回 group）**，参团同时生成拼团订单（订单 remark 含"拼团订单 #id"）
- `api.group.detail(id)` → group + `goods`（完整商品，含 specs 供选规格）+ `remainSeconds` + `myOrders:[{id,orderNo,status}]`
- `api.group.mine()` → 我参与/发起的团（含 remainSeconds）
- 过期自动退款：任何 group 接口访问时自动扫描，过期拼团中团 → status 3（未成团已退款），关联订单自动取消并推送消息

### 分享裂变（优化5-4）
- `api.share.reward(type, relatedId)` → `{points:5, remainToday}`；type 'goods'|'group'；**5 积分/次，3 次/天上限**（超限失败）。商品详情页分享、拼团详情页分享后调用
- `api.share.invite()` → `{ok, couponName:'满39减8', msg}`；**1 次/天**，发放邀新优惠券 + 消息

### 客服（优化4）
- `api.service.start()` → `{welcome, hotQuestions[6]}`
- `api.service.reply(question)` → `{answer, matched}`（mock 规则引擎：配送/售后/优惠券/积分/拼团/秒杀/发票/品质/地址/支付/问候 等关键词命中预设回复，未命中返回兜底话术）
- `api.service.rate({speed, solve, content})` → 客服满意度评价（响应速度/解决问题 1~5 星）

### 售后（优化4）
- `api.aftersale.reasons()` → `{reasons: {1:[...],2:[...],3:[...]}, typeText:{1:'仅退款',2:'退货退款',3:'换货'}, statusText:{1:'待审核',2:'处理中',3:'已完成',4:'已拒绝',5:'已撤销'}}`
- `api.aftersale.apply({orderId, type, reason, desc?, images?})` → 创建工单（status=1），同步写入订单 timeline + order.afterSale + 消息
- `api.aftersale.page({current,size,status})` → 分页工单（附 typeText/statusText）
- `api.aftersale.detail(id)` → 工单 + order 摘要
- `api.aftersale.advance(id)` → 演示推进：待审核→处理中→已完成（退款/退货/换货话术随 type 变化），同步订单 timeline + 消息
- `api.aftersale.cancel(id)` → 撤销（仅待审核/处理中）
- 订单对象新增 `afterSale: {ticketId, type, status}`（申请过售后才存在）

### 消息跳转（优化3-5）
消息对象新增 `link` 字段（页面路由）。消息中心点击跳转规则：
1. `link` 非空 → `wx.navigateTo(link)`（tabBar 页面用 `wx.switchTab`，判断 link 是否以 /pages/index|classic|cart|mine 开头）
2. link 为空且 type=2 且 relatedId → 兜底跳订单详情（mock 已自动补 link，页面直接用即可）

## 8. V1.1 新增页面（app.json 已注册，扁平文件结构，深度 2 → 相对路径 `../../`）

| 页面 | 路径 | 说明 |
|---|---|---|
| 秒杀场次 | `pages/promotion/seckill.*` | 路由 `/pages/promotion/seckill` |
| 拼团详情 | `pages/group/detail.*` | 路由 `/pages/group/detail?id=xx` |
| 客服会话 | `pages/service/chat.*` | 路由 `/pages/service/chat` |
| 申请售后 | `pages/service/aftersale.*` | 路由 `/pages/service/aftersale?orderId=xx&type=1` |
| 售后工单 | `pages/service/tickets.*` | 路由 `/pages/service/tickets`（支持 ?id=xx 自动展开详情） |

积分类型新增 `6: '分享奖励'`（points 明细页 typeText 由接口下发，无需改前端映射）。
