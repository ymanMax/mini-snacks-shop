// utils/format.js —— 金额与时间格式化（金额统一为数字，前端格式化展示）

// 四舍五入到分
function money(n) {
  const num = Number(n) || 0
  return Math.round(num * 100) / 100
}

// 格式化价格：formatPrice(12) => '￥12.00'
function formatPrice(n, withSymbol) {
  const num = money(n)
  const str = num.toFixed(2)
  if (withSymbol === false) return str
  return '￥' + str
}

// 销量展示：>=10000 显示 x.x万
function formatSales(n) {
  n = Number(n) || 0
  if (n >= 10000) return (Math.floor(n / 1000) / 10).toFixed(1) + '万'
  return '' + n
}

// 时间戳/字符串 -> '2026-09-07 12:00'
function formatTime(d, withSeconds) {
  if (!(d instanceof Date)) d = new Date(d)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  let s = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
    ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
  if (withSeconds) s += ':' + p(d.getSeconds())
  return s
}

function formatDate(d) {
  return formatTime(d).slice(0, 10)
}

// 距离当前时间的友好显示
function fromNow(t) {
  const d = t instanceof Date ? t : new Date(String(t).replace(/-/g, '/'))
  const diff = Date.now() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 3600 * 1000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 24 * 3600 * 1000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 30 * 24 * 3600 * 1000) return Math.floor(diff / 86400000) + '天前'
  return formatDate(d)
}

// 倒计时：ms -> {h,m,s,text:'02:15:33'}
function countdown(ms) {
  ms = Math.max(0, ms)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor(ms % 3600000 / 60000)
  const s = Math.floor(ms % 60000 / 1000)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return {
    h: h, m: m, s: s,
    text: (h > 99 ? '99+' : p(h)) + ':' + p(m) + ':' + p(s)
  }
}

// 星级文本：starText(4) => '★★★★☆'
function starText(n) {
  n = Math.max(0, Math.min(5, Math.round(Number(n) || 0)))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

module.exports = {
  money: money,
  formatPrice: formatPrice,
  formatSales: formatSales,
  formatTime: formatTime,
  formatDate: formatDate,
  fromNow: fromNow,
  countdown: countdown,
  starText: starText
}
