// utils/format.js —— 金额/数字/时间统一格式化（金额一律数字参与计算）

// 分转元不需要；本项目金额单位统一为「元」，保留两位小数
function toNumber(price) {
  const n = parseFloat(price);
  return isNaN(n) ? 0 : n;
}

// 6.9 -> "6.90"
function fixed(price) {
  return toNumber(price).toFixed(2);
}

// 6.9 -> "¥6.90"
function formatPrice(price) {
  return '¥' + fixed(price);
}

// 价格整数与小数拆分，方便大号价格展示（如 ¥6 / .90）
function priceParts(price) {
  const s = fixed(price);
  const i = s.indexOf('.');
  return { int: s.slice(0, i), decimal: s.slice(i) };
}

// 金额相加（避免浮点误差）
function add() {
  let args = Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments);
  const sum = args.reduce((acc, n) => acc + Math.round(toNumber(n) * 100), 0);
  return Math.round(sum) / 100;
}

function mul(a, b) {
  return Math.round(toNumber(a) * toNumber(b) * 100) / 100;
}

// 销量格式化：12000 -> "1.2万"
function formatSales(n) {
  n = toNumber(n);
  if (n >= 10000) return (Math.round(n / 1000) / 10).toFixed(1).replace(/\.0$/, '') + '万';
  return String(n);
}

// 距离：2.5 -> "2.5km"
function formatDistance(km) {
  return toNumber(km) + 'km';
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatTime(date, withTime = true) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime ? `${s} ${pad(d.getHours())}:${pad(d.getMinutes())}` : s;
}

// 相对时间：几分钟前 / 几小时前 / 几天前
function timeAgo(time) {
  const t = new Date(time.replace(/-/g, '/')).getTime();
  const diff = Date.now() - t;
  if (isNaN(diff)) return time;
  const min = 60000, hour = 3600000, day = 86400000;
  if (diff < min) return '刚刚';
  if (diff < hour) return Math.floor(diff / min) + ' 分钟前';
  if (diff < day) return Math.floor(diff / hour) + ' 小时前';
  if (diff < day * 30) return Math.floor(diff / day) + ' 天前';
  return time.slice(0, 10);
}

module.exports = {
  toNumber,
  fixed,
  formatPrice,
  priceParts,
  add,
  mul,
  formatSales,
  formatDistance,
  formatTime,
  timeAgo
};
