/**
 * 全局格式化工具
 * 规范：金额一律为纯数字（元，两位小数），展示时统一走 formatPrice，禁止字符串价格参与计算
 */

/** 金额格式化：12.5 -> "￥12.50" */
function formatPrice(price) {
  const n = Number(price);
  if (isNaN(n)) return '￥0.00';
  return '￥' + n.toFixed(2);
}

/** 仅保留两位小数字符串：12.5 -> "12.50" */
function toFixed2(price) {
  const n = Number(price);
  if (isNaN(n)) return '0.00';
  return n.toFixed(2);
}

/** 金额安全相加（避免浮点误差）：safeAdd(0.1, 0.2) -> 0.3 */
function safeAdd(a, b) {
  return Math.round((Number(a) + Number(b)) * 100) / 100;
}

/** 金额安全相乘：safeMul(19.9, 3) -> 59.7 */
function safeMul(a, b) {
  return Math.round(Number(a) * Number(b) * 100) / 100;
}

/** 销量格式化：12345 -> "1.2万" */
function formatSales(n) {
  n = Number(n) || 0;
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}

/** 数字补零 */
function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

/**
 * 日期格式化
 * @param {Date|number|string} date
 * @param {string} fmt 支持 YYYY MM DD HH mm ss
 */
function formatDate(date, fmt = 'YYYY-MM-DD HH:mm') {
  let d = date;
  if (typeof date === 'string' && /^\d+$/.test(date)) d = Number(date);
  if (!(d instanceof Date)) d = new Date(d);
  if (isNaN(d.getTime())) return '';
  const o = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => o[k]);
}

/** 倒计时格式化：秒 -> { h, m, s }（字符串补零） */
function countdown(seconds) {
  let s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  s = s % 60;
  return { h: pad(h), m: pad(m), s: pad(s) };
}

module.exports = {
  formatPrice,
  toFixed2,
  safeAdd,
  safeMul,
  formatSales,
  formatDate,
  countdown,
  pad
};
