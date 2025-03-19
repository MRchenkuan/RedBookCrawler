import { CookieJar } from 'tough-cookie';
import axiosDefault from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import headers from './headers.js';
import note_list from './note_list.js';
import { saveCommentsCSV } from './csv_tool.js';
import { URL } from 'node:url';
import cookies from './cookie.js';


/**
 * 初始化客户端
 */
function initClientPool(cookies){
  let currentIndex = 0;
  const jar = new CookieJar();
  const pool = cookies.map(cookie=>{
    /* 初始化cookie */
    jar.setCookie(
      cookie, 
      'https://edith.xiaohongshu.com',
      { ignoreError: true }
    );

    // 创建axios实例
    const axios = wrapper(axiosDefault.create({
      jar,  // 仅保留必要的 jar 配置
    }));

    const instance = axios.create({
      baseURL: 'https://edith.xiaohongshu.com',
      jar, // Cookie持久化
      headers:{
        ...headers,
        'Cookie': cookie
      }
    });
    return {
      cookie,
      instance
    };
  })

  return{
    pool,
    getClinet(repeatClinet){
      if(repeatClinet)currentIndex = currentIndex-1;
      currentIndex = (currentIndex + 1) % pool.length
      return pool[currentIndex]
    },
  }
}

const pool = initClientPool(cookies);




// API请求函数
export async function fetchCommentPage(noteId, xsec_token, cursor) {
  const instance = pool.getClinet().instance;
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

// 从路径中提取 24 位十六进制格式的 ID
function extractIdFromPath(path) {
  const parts = path.split('/');
  for (const part of parts) {
    if (/^[a-f0-9]{24}$/.test(part)) {
      return part;
    }
  }
  return null;
}

// 手动跟踪重定向获取最终 URL
async function getRedirectedUrl(url) {
  const instance = pool.getClinet(true).instance;

  let currentUrl = url;
  let redirectCount = 0;
  const maxRedirects = 10;

  while (redirectCount < maxRedirects) {
    const response = await instance.get(currentUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) throw new Error('Redirect location missing');
      currentUrl = new URL(location, currentUrl).href; // 处理相对路径
      redirectCount++;
    } else {
      return currentUrl;
    }
  }
  throw new Error(`Exceeded max redirects (${maxRedirects})`);
}

let page = 100, c, t, c_list = []

async function getComments(noteId, xsec_token, duration) {
  setTimeout(async () => {
    try{
      const {cursor, xsec_token:xsec_token_new, comments, has_more, time} = await fetchCommentPage(noteId, xsec_token,c) || {};
      c_list = c_list.concat(comments.map(it=>{it.user_info=it.user_info.nickname;return it}));
      // 大于5000条分个文件
      if(c_list.length>3000){
        await saveCommentsCSV(c_list);
        console.log('Comment data:>5000, save', c_list.length);
        c_list = [];
      }
      if(!has_more) return;
      if(page-->0){
        c = cursor;
        t = xsec_token_new;
        const r = await getComments(noteId, xsec_token, duration)
      }
    }catch(e){
      console.error(e)
      await saveCommentsCSV(c_list);
      c_list=[];
    }
  }, duration);
}

async function readLink(note_list, i, duration){
  setTimeout(async () => {
    try{
      const {id:noteId, xsec_token} = await getUrlParams(note_list[note_list.length - i])
      if(noteId && xsec_token){
        await getComments(noteId, xsec_token, duration)
      }
      if(i-->0) {
        console.log(`已抓取评论${c_list.length}; ${note_list.length - i}/${note_list.length}`)
        await readLink(note_list, i, duration);
      }
    }catch(e){
      await saveCommentsCSV(c_list);
      c_list=[];
      console.error(e)
    }
  }, 1000);
}



// 主函数：获取 ID 和 xsec_token
async function getUrlParams(url) {
  if(!url){
    console.warn('空链接')
    return {
      id:null,
      xsec_token:null
    }
  }
  const parsedUrl = new URL(url);
  const originalId = extractIdFromPath(parsedUrl.pathname);
  const originalToken = parsedUrl.searchParams.get('xsec_token');

  // 如果原始链接已包含参数，直接返回
  if (originalId && originalToken) {
    console.log('连接合法直接返回',originalId,originalToken)
    return { id: originalId, xsec_token: originalToken };
  }

  // 需要跟踪重定向获取最终 URL
  const finalUrl = await getRedirectedUrl(url);
  const finalParsed = new URL(finalUrl);
  const finalId = extractIdFromPath(finalParsed.pathname);
  const finalToken = finalParsed.searchParams.get('xsec_token');

  if (!finalId || !finalToken) {
    // await saveCommentsCSV(c_list);
    // c_list=[]
    console.warn('链接访问不了',finalId, finalToken)
    return {
      id:finalId,
      xsec_token:finalToken
    }
  }
  console.log('跟踪重定向',finalId,finalToken)
  return { id: finalId, xsec_token: finalToken };
}


// 对note_list进行去重处理
const uniqueNoteList = [...new Set(note_list)];
console.log(`原始链接数量: ${note_list.length}, 去重后链接数量: ${uniqueNoteList.length}`);

// 遍历 (使用去重后的链接列表)
await readLink(uniqueNoteList, uniqueNoteList.length, 2500);
if(c_list.length){
  saveCommentsCSV(c_list);
  c_list=[]
}



