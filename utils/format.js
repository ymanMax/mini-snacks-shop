// utils/format.js —— 金额与时间格式化（优化 9）
// 红线：金额统一为数字（元），禁止字符串价格参与计算

// 数字 -> "￥xx.xx"
function formatPrice(price) {
  const n = Number(price);
  if (isNaN(n)) return '￥0.00';
  return '￥' + n.toFixed(2);
}

// 数字 -> "xx.xx"（不带符号）
function priceText(price) {
  const n = Number(price);
  if (isNaN(n)) return '0.00';
  return n.toFixed(2);
}

// 安全的金额乘法（避免浮点误差），返回两位小数数字
function mul(a, b) {
  return Math.round(Number(a) * 100 * Number(b)) / 100;
}

// 安全的金额加法
function add(a, b) {
  return Math.round((Number(a) * 100 + Number(b) * 100)) / 100;
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

// Date | 时间戳 | "2026-09-07 12:00:00" -> 格式化字符串
function formatDate(input, fmt = 'YYYY-MM-DD HH:mm') {
  let d;
  if (input instanceof Date) d = input;
  else if (typeof input === 'number') d = new Date(input);
  else d = new Date(String(input).replace(/-/g, '/'));
  if (isNaN(d.getTime())) return '';
  const map = {
    'YYYY': d.getFullYear(),
    'MM': pad2(d.getMonth() + 1),
    'DD': pad2(d.getDate()),
    'HH': pad2(d.getHours()),
    'mm': pad2(d.getMinutes()),
    'ss': pad2(d.getSeconds())
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, k => map[k]);
}

module.exports = { formatPrice, priceText, mul, add, pad2, formatDate };
