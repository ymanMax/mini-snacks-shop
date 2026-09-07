// mock/util.js —— Mock 层公共工具

const r2 = (n) => Math.round(n * 100) / 100

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

// 返回 n 天前 h:m 的 Date
function daysAgo(n, h, m) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  if (h != null) d.setHours(h, m || 0, 0, 0)
  return d
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 3600 * 1000)
}

function fmt(d) {
  if (!(d instanceof Date)) d = new Date(d)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function fmtDay(d) {
  if (!(d instanceof Date)) d = new Date(d)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

// n 天后的结束时间字符串（用于秒杀/拼团倒计时）
function endOfToday() {
  const d = new Date()
  d.setHours(23, 59, 59, 0)
  return d.getTime()
}

function hoursLater(n) {
  return Date.now() + n * 3600 * 1000
}

// 统一分页
function paginate(list, params) {
  const current = parseInt((params && params.current) || 1)
  const size = parseInt((params && params.size) || 10)
  const total = list.length
  const start = (current - 1) * size
  return {
    records: list.slice(start, start + size),
    total: total,
    current: current,
    size: size,
    hasMore: start + size < total
  }
}

function orderNo(seq) {
  const d = new Date()
  return 'SN' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(1000 + seq)
}

module.exports = {
  r2: r2,
  pad: pad,
  daysAgo: daysAgo,
  hoursAgo: hoursAgo,
  fmt: fmt,
  fmtDay: fmtDay,
  endOfToday: endOfToday,
  hoursLater: hoursLater,
  paginate: paginate,
  orderNo: orderNo
}
