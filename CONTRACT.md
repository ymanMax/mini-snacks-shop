# 页面开发契约（所有页面开发必须严格遵守）

本契约是 mini-snacks-shop 改造的**唯一事实来源**。基础设施（mock 数据、API 层、全局样式、工具类）已完成并通过了业务冒烟测试，页面层只允许**消费**这些设施，禁止修改基础设文件（如需改动请在报告中提出）。

## 0. 项目结构

```
/mnt/tos/workspace/mini-snacks-shop
├── app.js / app.json / app.wxss   # 已完成，禁止修改（页面路由已注册完毕）
├── api/http.js                    # USE_MOCK 开关口，已完成
├── api/index.js                   # 全部业务接口函数，已完成
├── mock/                          # Mock 数据体系，已完成
├── utils/toast.js utils/format.js utils/format.wxs utils/util.js utils/area.js
├── static/images/default.png      # 全局图片兜底
├── static/mock/*.png              # 本地占位图（banner1-3/theme1-3/goods1-24/detail1-4/shop1-3/avatar*/logo）
└── pages/                         # 你们的工作区
```

## 1. 取数红线

1. 页面**只允许** `const api = require('../../api/index.js')`（按实际相对路径），调用其中导出的函数，返回 Promise（已解包为 data，分页结构 `{ records, total, current, size }`）。
2. **禁止** `wx.request`、`wx.uploadFile`；禁止 import `mock/*`、`api/http.js`；禁止自行 `wx.setStorageSync` 写业务数据（搜索历史等纯前端偏好除外）。
3. api 调用失败会自动 toast；需要静默处理时自行 `.catch(() => {})`。
4. mock 接口自带 200~600ms 延迟：首屏必须配骨架屏/loading 态，请求返回后渲染。

## 2. 全局能力（app.js 提供）

- `getApp().globalData.userInfo`：当前用户（onLaunch 已注入 Mock 用户，永远非空）。
- `getApp().refreshCartBadge()`：加购/删购/下单后调用，刷新 TabBar 角标并广播。
- `getApp().onCartCountChange(cb)`：订阅购物车数量（用于首页悬浮角标等），返回取消订阅函数，页面 onUnload 时调用取消。
- `getApp().mockLogin()` / `getApp().mockLogout()`：我的页面用。

## 3. 工具类

- `utils/toast.js`：`showToast(title,icon,duration)` / `success(t)` / `error(t)` / `showLoading(t)` / `hideLoading()` / `confirm(content,title)`（返回 Promise<boolean>）。
- `utils/format.js`：`formatPrice(n)` → "￥xx.xx"；`priceText(n)` → "xx.xx"；`formatDate(input,fmt)`；金额运算用 `mul/add`。**禁止字符串价格参与计算**。
- WXML 价格渲染统一用 WXS：`<wxs src="../../utils/format.wxs" module="f" />`，`{{f.fp(item.price)}}`（两位小数）、`{{f.sold(n)}}`（销量过万格式化）。
- 页面内价格显示：`<text class="price"><text class="symbol">￥</text>{{f.fp(x)}}</text>`。

## 4. 设计规范（优化 9）

- 主题色 `#b4282d`：价格高亮、主按钮、选中态、角标、评分星。浅主题底 `#fbeaea`。
- 页面背景 `#f5f6f7`；卡片白底圆角 16rpx（可直接用全局 `.card`）；间距以 24rpx 为基准。
- 全局可复用类（app.wxss 已定义）：`.price .symbol .price-origin .btn-primary .btn-plain .card .tag .tag.gray .empty-state(.empty-img/.empty-text/.empty-btn) .skeleton .ellipsis .ellipsis-2 .badge .hairline .demo-tip`。
- 骨架屏：用 `.skeleton` 灰色块（呼吸动画已在全局定义），首屏 loading 时展示。
- 空态：所有列表页必须有空态（`.empty-state` 结构 + 可选操作按钮）。
- 每个页面 json 配置语义化 `navigationBarTitleText`；需要下拉刷新的页面在页面 json 里 `"enablePullDownRefresh": true`，并实现 `onPullDownRefresh`（结束时 `wx.stopPullDownRefresh()`）。

## 5. 图片红线

- **每个 `<image>` 都必须** `binderror="onImgError"` 回退兜底图。推荐统一写法：
  ```js
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
  ```
  wxml：`src="{{item._imgErr ? '/static/images/default.png' : item.pic}}" data-key="{{index}}" data-field="list" binderror="onImgError"`。
- 商品图片字段永远非空（mock 保证），但仍需 binderror。
- `<video>` 必须 `binderror`：出错时 setData 隐藏视频入口（Tab）。

## 6. 核心数据模型（与 mock 对齐）

- **goods**：`id, name, pic, pics[], videoUrl, videoCover, videoIntro, categoryId, categoryName, minPrice, originalPrice, memberPrice(可为null), numberSells, stock, unit, origin, tags[], specs:[{name,values:[{label,price?,stock?,pic?}]}], description, detailImages[], viewCount, collectCount, isCollect, hot, hotScore`。规格第 0 维"规格"带 price/stock，第 1 维"口味"仅 label。
- **cart**：`GET /cart/list` → `{ valid:[], invalid:[] }`；cartItem `{ id, goodsId, name, pic, specText, price, count, checked, stock, invalid }`。
- **order**：`{ id, orderNo, status(1待付款 2待发货 3配送中 4待收货 5已完成 6已取消), items[{goodsId,name,pic,specText,price,count}], totalAmount, discountAmount, freight, payAmount, couponTitle, payType(1微信 2货到付款), remark, deliveryDate, deliverySlot, addressSnapshot{name,phone,province,city,district,detail}, rider{name,phone}|null, timeline[{time,status,remark}], isReviewed, createTime }`。订单列表 status 参数额外支持 `7=待评价`（已完成且未评价）。
- **review**：`{ id, goodsId, userName, avatar, score(1-5), tags[], content, images[], createTime }`；`getGoodsReviews` 返回分页结构额外带 `summary:{avg,count,tags:[{name,count}]}`。
- **shopReview**：`{ id, userName, avatar, scores:{fresh,speed,package}, content, createTime }`；`getShopReviews` 带 `summary:{fresh,speed,package}`。
- **member info**：`{ userId, nickName, avatar, phone, level, levelName, growthValue, nextLevelGrowth, nextLevelName, points, couponCount, validDate, privileges[], discountText, isBirthdayMonth, birthdayClaimed }`。
- **coupon**：`{ id, tplId, name, type(1满减 2折扣 3无门槛), threshold, discount(折扣券88=8.8折), scope, status(1未使用 2已使用 3已过期), expireTime, source }`。
- **message**：`{ id, type(1系统 2订单 3促销 4互动), title, content, isRead, createTime, relatedId }`。
- **checkin info**：`{ continuousDays, todaySigned, monthRecords[日号], rewards[5,5,10,10,15,20,50], rules[], year, month }`。
- **groupBuy**：`{ id, goodsId, name, pic, groupPrice, originalPrice, requiredCount, joinedCount, status(1拼团中 2已成团 3未成团已退款), members[{avatar,name,isLeader}], endTime, rules }`。
- **footprint**：`[{ date:'今天'|'昨天'|'YYYY-MM-DD', items:[{goodsId,name,pic,minPrice,time}] }]`。
- **seckill**：`{ title, endTime, goods:[{goodsId,name,pic,seckillPrice,originalPrice,stock,soldPercent}] }`；fullReduce：`{ title, rules:[{threshold,reduce}] }`。

## 7. API 函数清单（api/index.js 已导出，直接调用）

首页：`getBanners() getThemes()`
商品：`getGoodsList({current,size,keywords,categoryId,sort,priceRange,origins,inStock,ids}) getGoodsDetail(id) getRecommend(goodsId,size)`
搜索：`getHotWords() getSuggest(keywords)`
分类：`getCategories()`
购物车：`getCartList() addToCart({goodsId,specText,price,count,pic,stock}) updateCartItem({id,count,checked}) checkAllCart(checked) deleteCartItems(ids) clearInvalidCart() getCartCount()`
地址：`getAddressList() saveAddress(data) deleteAddress(id) setDefaultAddress(id)`
订单：`getOrderList({status,current,size}) getOrderDetail(id) getOrderStatusCount() previewOrder({items,addressId,couponId}) createOrder(data) payOrder(id) cancelOrder(id) confirmOrder(id) advanceOrder(id) rebuyOrder(id)`
评价：`getGoodsReviews({goodsId,current,size}) getShopReviews({current,size}) submitReview({orderId,goodsReviews,shopScores,shopContent})`
会员：`getMemberInfo() getMemberLevels() claimBirthdayGift()`
积分：`getPointsInfo() getPointsRecords({current,size}) getPointsMall() exchangePoints(id)`
签到：`getCheckinInfo() signCheckin()`
优惠券：`getCouponCenter() claimCoupon(id) getMyCoupons(status) getUsableCoupons(amount)`
促销拼团：`getSeckill() getFullReduce() getGroupList() getWholesale()`
消息：`getMessages({current,size}) getUnreadCount() readMessage(id) readAllMessages()`
店铺用户：`getShopInfo() getUserInfo() updateUserInfo({nickName,avatar})`
收藏足迹：`toggleCollect(goodsId) getCollectList() removeCollects(goodsIds) getFootprints() clearFootprints()`

## 8. 通用交互约定

- 加购成功后 `toast.success('已加入购物车')` 并 `getApp().refreshCartBadge()`。
- 跳 Tab 页用 `wx.switchTab`（首页/分类/购物车/我的），其余用 `wx.navigateTo`；商品详情路由：`/pages/detail/detail?id={{goodsId}}`。
- 页面返回需刷新数据：Tab 页和列表页在 `onShow` 重查关键数据（购物车、订单角标、收藏态）。
- 涉及金钱处加"演示环境，不产生真实交易"提示（`.demo-tip`）。
- 排序参数：`sort` ∈ `default | price_asc | price_desc | sales`；价格区间 `priceRange` ∈ `0-50 | 50-100 | 100-200 | 200+`。
- 分页统一：`current` 从 1 开始，`size: 10`；`records.length < size` 或 `list.length >= total` 视为没有更多，显示"没有更多了~"。
- 半屏弹层（SKU/筛选/客服等）：纯 WXML+CSS 实现（遮罩 + 底部滑入动画），不引入第三方组件库。
- emoji 可用于图标（🛒🔍⭐❤️ 等），保持风格统一。

---

# V1.1 延伸需求附录（2026-09-07 新增）

## 新增 API（api/index.js 已导出）

- 秒杀：`getSeckillSessions()` → `{ sessions:[{ id, title, startTime, endTime, status(1进行中 2即将开始 3已结束), goods:[{goodsId,name,pic,seckillPrice,originalPrice,stock,soldPercent}] }] }`；原 `getSeckill()` 保持兼容（首页用）。
- 最优券：`getBestCoupon(amount)` → `{ coupon|null, saving }`（自动最优组合）。
- 配送：`getDeliveryRule()` → `{ rule:{baseFee,baseKm,perKmFee,freeThreshold,maxKm}, freeThreshold(会员加权后), maxKm }`。`previewOrder` 新增返回 `outOfRange`、`maxKm`；`createOrder` 对超范围地址会报错"该地址暂不支持配送"。
- 分享：`shareReward('goods'|'group')` → `{ points:5, times }`（每日限 3 次，失败静默）；`shareInvite(fromUserId)` → `{ coupon }`（app.js 已处理 inviteBy 启动参数）。
- 客服：`getServiceFaq()` → `{ greeting, faqs:[{q,a}] }`；`askService(content)` → `{ reply, matched }`；`rateService({speed,satisfaction,content})` → `{ points:5 }`。
- 售后：`applyAftersale({orderId,type(1仅退款 2退货退款 3换货),reason,description,images})` → ticket；`getAftersaleList({current,size})` / `getAftersaleDetail(id)` / `getAftersaleByOrder(orderId)` / `advanceAftersale(id)`（演示推进 1待审核→2处理中→3已完成）/ `cancelAftersale(id)`（仅待审核可撤销→5已撤销）。ticket 字段：`{ id, orderId, orderNo, goodsSummary, pic, type, typeText, reason, description, images, amount, status(1待审核 2处理中 3已完成 4已拒绝 5已撤销), timeline[{time,status,remark}], createTime }`。申请售后会写入订单 timeline + 消息。仅 status 4/5 的订单可申请，且不可重复申请。
- 拼团：`getGroupDetail(id)` → group + `{ goods:{id,name,pic,specs,minPrice,stock}, joined, myOrderId }`；`getGroupByGoods(goodsId)` → 进行中的团或 null；`getJoinableGroups()` / `getMyGroups()`（带 myOrderId/isLeader）；`startGroup({goodsId,specText,count})` → `{ group, order }`（开团价=商品 minPrice×0.8，2 人成团，生成待支付订单）；`joinGroup({groupId,specText,count})` → `{ group, order }`（满员自动成团 status=2 + 消息）。流程：调 start/join 得到 order → 页面走 Mock 支付 `payOrder(order.id)` → 刷新拼团详情。
- 消息模型新增 `relatedType`（'order'|'coupon'|'group'|'aftersale'|'seckill'|null）——跳转路由表：order→/pages/order/detail?id=relatedId；coupon→/pages/coupon/center?tab=mine；group→/pages/group/detail?id=relatedId；aftersale→/pages/service/aftersale；seckill→/pages/seckill/index。

## 新增页面路由（app.json 已注册）

`pages/seckill/index`、`pages/group/detail`、`pages/service/chat`、`pages/service/apply`、`pages/service/aftersale`

## 设计补充

- 售后状态色：1橙 2蓝 3绿 4红 5灰；拼团状态色沿用 1橙 2绿 3灰。
- 客服会话页：左侧客服气泡（白底圆角带头像🍟）、右侧用户气泡（主题红底白字）；输入栏固定底部。
- 邀请分享 path 约定：商品 `/pages/detail/detail?id={{id}}&inviteBy={{userId}}`；拼团 `/pages/group/detail?id={{id}}&inviteBy={{userId}}`（userId=getApp().globalData.userInfo.id）。
