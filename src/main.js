import { CookieJar } from 'tough-cookie';
import axiosDefault from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import cookieStr from './cookie.js'
import headers from './headers.js';

import note_list from './note_list.js';
import { parseXHSURL } from './utils.js';
import { saveCSV } from './csv_tool.js';

const jar = new CookieJar();


// 创建axios实例
const axios = wrapper(axiosDefault.create({
  jar,  // 仅保留必要的 jar 配置
}));

const instance = axios.create({
  baseURL: 'https://edith.xiaohongshu.com',
  jar, // Cookie持久化
  headers
});

// 初始化Cookie
const initCookies = async () => {
  await jar.setCookie(
    cookieStr, 
    'https://edith.xiaohongshu.com',
    { ignoreError: true }
  );
};


const {noteId, params:{xsec_token}} = parseXHSURL(note_list[0])


// API请求函数
export async function fetchCommentPage(xsec_token, cursor) {
  try {
    const params = {
      note_id: noteId,
      cursor,
      top_comment_id: '',
      image_formats: 'jpg,webp,avif',
      xsec_token: xsec_token
    };

    const response = await instance.get('/api/sns/web/v2/comment/page', {
      params,
      timeout: 5000,
      validateStatus: (status) => status < 400 || status === 403
    });

    if(response.data.success) {
      return response.data.data 
    }else {
      console.error(response.data);
      throw new Error(response);
    }
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
  }
}

// 使用示例
(async () => {
  await initCookies();

  let page = 4, c, t = xsec_token, c_list = []
  while(page-->0){
    const {cursor, xsec_token:xsec_token_new, comments, has_more, time} = await fetchCommentPage(xsec_token,c);
    c = cursor;
    t = xsec_token_new;
    c_list = c_list.concat(comments.map(it=>{it.user_info=it.user_info.nickname;return it}));
  }

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
  ]
  saveCSV('./comments.csv',c_list,h);
  // 第一页
  
  // 第二页
  console.log('Comment data:', c_list);
})();



