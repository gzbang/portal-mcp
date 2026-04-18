/**
 * 安全添加字段到输出（避免重复的 if 判断）
 * @param {string} output - 当前输出字符串
 * @param {object} obj - 数据对象
 * @param {string} field - 字段名
 * @param {string} label - 显示标签（可选，默认使用字段名）
 * @param {function} formatter - 格式化函数（可选）
 * @returns {string} 添加后的输出字符串
 */
function addField(output, obj, field, label, formatter) {
  const value = obj?.[field];
  if (value === undefined || value === null || value === '' || value === 'N/A') {
    return output;
  }
  
  const displayLabel = label || field;
  const displayValue = formatter ? formatter(value) : value;
  
  return output + `${displayLabel}: ${displayValue}\n`;
}

/**
 * 批量添加多个字段
 * @param {string} output - 当前输出字符串
 * @param {object} obj - 数据对象
 * @param {array} fields - 字段配置数组 [{field, label, formatter}]
 * @returns {string} 添加后的输出字符串
 */
function addFields(output, obj, fields) {
  let result = output;
  for (const config of fields) {
    result = addField(result, obj, config.field, config.label, config.formatter);
  }
  return result;
}

/**
 * 添加带缩进的字段（用于嵌套列表）
 * @param {string} output - 当前输出字符串
 * @param {object} obj - 数据对象
 * @param {string} field - 字段名
 * @param {string} label - 显示标签
 * @param {number} indent - 缩进空格数（默认 3）
 * @param {function} formatter - 格式化函数
 * @returns {string} 添加后的输出字符串
 */
function addIndentedField(output, obj, field, label, indent = 3, formatter) {
  const value = obj?.[field];
  if (value === undefined || value === null || value === '' || value === 'N/A') {
    return output;
  }
  
  const spaces = ' '.repeat(indent);
  const displayValue = formatter ? formatter(value) : value;
  
  return output + `${spaces}${label}: ${displayValue}\n`;
}

/**
 * 批量添加带缩进的字段
 * @param {string} output - 当前输出字符串
 * @param {object} obj - 数据对象
 * @param {array} fields - 字段配置数组 [{field, label, formatter}]
 * @param {number} indent - 缩进空格数
 * @returns {string} 添加后的输出字符串
 */
function addIndentedFields(output, obj, fields, indent = 3) {
  let result = output;
  for (const config of fields) {
    result = addIndentedField(result, obj, config.field, config.label, indent, config.formatter);
  }
  return result;
}

/**
 * 截断长文本
 * @param {string} text - 文本内容
 * @param {number} maxLength - 最大长度（默认 100）
 * @returns {string} 截断后的文本
 */
function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 清理 HTML 标签
 * @param {string} html - HTML 内容
 * @returns {string} 纯文本
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 格式化布尔值为中文
 * @param {boolean} value - 布尔值
 * @returns {string} 是/否
 */
function formatBoolean(value) {
  return value ? '是' : '否';
}

/**
 * 格式化日期为本地格式
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期
 */
function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('zh-CN');
  } catch {
    return date;
  }
}

/**
 * 格式化数组为逗号分隔字符串
 * @param {array} arr - 数组
 * @returns {string} 格式化后的字符串
 */
function formatArray(arr) {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join(', ');
}

/**
 * 格式化数量（带单位）
 * @param {number} count - 数量
 * @param {string} unit - 单位（默认 '个'）
 * @returns {string} 格式化后的字符串
 */
function formatCount(count, unit = '个') {
  return `${count} ${unit}`;
}

/**
 * 格式化文件大小
 * @param {string|number} size - 大小
 * @returns {string} 格式化后的大小
 */
function formatSize(size) {
  if (!size) return 'N/A';
  return size;
}

/**
 * 根据映射表格式化值（用于状态码、类型码等）
 * @param {string|number} value - 原始值
 * @param {object} mapping - 映射表 {value: label}
 * @param {string} fallback - 默认值（默认返回原值）
 * @returns {string} 格式化后的值
 */
function formatByMapping(value, mapping, fallback) {
  return mapping[value] ?? (fallback !== undefined ? fallback : value);
}

/**
 * 构建带分隔符的输出行
 * @param {string} label - 标签
 * @param {string} value - 值
 * @param {string} separator - 分隔符（默认 ': '）
 * @returns {string} 格式化后的行
 */
function buildLine(label, value, separator = ': ') {
  if (!value && value !== 0) return '';
  return `${label}${separator}${value}\n`;
}

/**
 * 构建带缩进的输出行
 * @param {number} indent - 缩进空格数
 * @param {string} label - 标签
 * @param {string} value - 值
 * @returns {string} 格式化后的行
 */
function buildIndentedLine(indent, label, value) {
  if (!value && value !== 0) return '';
  return `${' '.repeat(indent)}${label}: ${value}\n`;
}

/**
 * 安全获取嵌套对象属性
 * @param {object} obj - 对象
 * @param {string} path - 属性路径（如 'data.user.name'）
 * @param {any} fallback - 默认值
 * @returns {any} 属性值或默认值
 */
function safeGet(obj, path, fallback = undefined) {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return fallback;
    result = result[key];
  }
  return result ?? fallback;
}

export {
  addField,
  addFields,
  addIndentedField,
  addIndentedFields,
  truncate,
  stripHtml,
  formatBoolean,
  formatDate,
  formatArray,
  formatCount,
  formatSize,
  formatByMapping,
  buildLine,
  buildIndentedLine,
  safeGet,
};