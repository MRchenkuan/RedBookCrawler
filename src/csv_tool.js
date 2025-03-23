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

export async function saveCommentsCSV(data, options = {}) {
  if(!data.length)return;
  const h = [
    { id: 'note_id', title: '帖子ID' },
    { id: 'id', title: '评论ID' },
    { id: 'target_comment_id', title: '父评论ID' },
    { id: 'content', title: '评论内容' },
    { id: 'ip_location', title: '评论IP' },
    { id: 'like_count', title: '喜欢数' },
    { id: 'create_time', title: '时间戳' },
    { id: 'user_info', title: '用户信息' },
    { id: 'at_users', title: '艾特的人' },
    { id: 'liked', title: '已喜欢' },
    { id: 'show_tags', title: '标签' },
    { id: 'status', title: '状态' },
  ];

  try {
    const basePath = './data/comments.csv';
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


export async function saveCommentsCSV2(data, options = {}) {
  if(!data.length)return;
  
  const h = [
    {"id":"u_user_id","title":""},
    {"id":"u_tenant_id","title":""},
    {"id":"u_platform","title":""},
    {"id":"u_ai_provider","title":""},
    {"id":"u_account_type","title":""},
    {"id":"u_identity_tags","title":""},
    {"id":"u_interest","title":""},
    {"id":"expand1","title":""},
    {"id":"expand2","title":""},
    {"id":"expand3","title":""},
    {"id":"expand4","title":""},
    {"id":"expand5","title":""},
    {"id":"type","title":""},
    {"id":"subtype","title":""},
    {"id":"sentiment","title":""},
    {"id":"neg_type","title":""},
    {"id":"keywords","title":""},
    {"id":"brands","title":""},
    {"id":"products","title":""},
    {"id":"content_type","title":""},
    {"id":"comm_type","title":""},
    {"id":"comm_reason","title":""},
    {"id":"comm_brand","title":""},
    {"id":"comment_id","title":""},
    {"id":"content","title":""},
    {"id":"platform","title":""},
    {"id":"score","title":""},
    {"id":"time","title":""},
    {"id":"like_count","title":""},
    {"id":"cls_type","title":""},
    {"id":"content_id","title":""},
    {"id":"parent_comment_id","title":""},
    {"id":"target_comment_id","title":""},
    {"id":"image_list","title":""},
    {"id":"user","title":""},
    {"id":"user_account","title":""},
    {"id":"sub_comment_count","title":""},
    {"id":"child_comment_count","title":""},
    {"id":"engagement_count","title":""},
    {"id":"post_user_replied","title":""},
    {"id":"post_user_replied_content","title":""},
    {"id":"prompt_personas","title":""},
    {"id":"suggested_response","title":""},
    {"id":"basic_suggested_response","title":""},
    {"id":"intermediate_suggested_response","title":""},
    {"id":"advanced_suggested_response","title":""},
    {"id":"process_status","title":""},
    {"id":"is_exception","title":""},
    {"id":"is_self","title":""},
    {"id":"content_info","title":""},
    {"id":"parent_content","title":""},
    {"id":"target_content","title":""},
    {"id":"staff_set_prompt_personas","title":""},
    {"id":"staff_upload_image_url","title":""},
    {"id":"staff_set_expect_liked_count","title":""},
    {"id":"staff_set_expect_publish_time","title":""},
    {"id":"exported_reply_crc32_list","title":""},
    {"id":"page_num","title":""},
    {"id":"page_position","title":""},
    {"id":"content_position","title":""},
    {"id":"possible_invalidation","title":""}
  ]

  try {
    const basePath = './data/system.comments.csv';
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