/**
 * Mock 时间工具：基于当前时间生成相对日期字符串（保证演示数据永远"新鲜"）
 */
function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

/**
 * @param {number} dayOffset 相对今天的天偏移（可为负，可为小数表示小时偏移）
 * @param {string} fmt 格式模板，未出现的字段按模板原样输出；时间部分若模板中为 HH:mm 等占位则使用当前时分
 */
function fmt(dayOffset, template) {
  const d = new Date(Date.now() + dayOffset * 86400000);
  const o = {
    YYYY: d.getFullYear(),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  };
  return (template || 'YYYY-MM-DD HH:mm').replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => o[k]);
}

/** 当前时间戳（ms） */
function now() {
  return Date.now();
}

module.exports = { fmt, now, pad };
