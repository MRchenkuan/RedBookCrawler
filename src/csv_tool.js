import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs/promises';
import path from 'path';

async function getUniqueFilePath(basePath) {
  let counter = 0;
  let filePath = basePath;
  const ext = path.extname(basePath);
  const baseName = path.basename(basePath, ext);
  const dir = path.dirname(basePath);

  while (true) {
    try {
      await fs.access(filePath, fs.constants.F_OK);
      counter++;
      filePath = path.join(dir, `${baseName}.${counter}${ext}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return filePath;
      }
      throw error;
    }
  }
}

export async function saveCSV(data, options = {}) {
  if(!data.length)return;
  const h = [
    { id: 'content', title: '评论内容' },
    { id: 'ip_location', title: '评论IP' },
    { id: 'like_count', title: '喜欢数' },
    { id: 'create_time', title: '时间戳' },
    { id: 'user_info', title: '用户信息' },
    { id: 'at_users', title: '艾特的人' },
    { id: 'id', title: '评论ID' },
    { id: 'liked', title: '已喜欢' },
    { id: 'show_tags', title: '标签' },
    { id: 'status', title: '状态' },
    { id: 'note_id', title: '帖子ID' },
  ];

  try {
    const basePath = './comments.csv';
    const filePath = await getUniqueFilePath(basePath);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: h,
      encoding: options.encoding || 'utf8',
      append: false, // 强制新建文件
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