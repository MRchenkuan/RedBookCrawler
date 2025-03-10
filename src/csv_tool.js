// csv-utils.js
import { createObjectCsvWriter } from 'csv-writer';

/**
 * 高级版 CSV 保存 (使用 csv-writer 库)
 * @param {string} filePath - 文件路径
 * @param {Array<Object>} data - 数据数组
 * @param {Array<{id: string, title: string}>} headers - 表头定义
 * @param {object} [options] - 配置选项
 * @returns {Promise<boolean>}
 */
export async function saveCSV(filePath, data, headers, options = {}) {
  try {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
      encoding: options.encoding || 'utf8',
      append: options.append || false,
      fieldDelimiter: options.delimiter || ',',
    });

    await csvWriter.writeRecords(data);
    console.log(`CSV saved to: ${filePath}`);
    return true;
  } catch (error) {
    console.error('CSV 保存失败:', error);
    return false;
  }
}