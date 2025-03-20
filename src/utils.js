import { CookieJar } from 'tough-cookie';
import axiosDefault from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import headers from './headers.js';
import { URL } from 'node:url';
import {options_headers} from './headers.js'
/**
 * 发送请求

/**
 * 初始化客户端池
 * @param {Array<string>} cookies - cookie字符串数组
 * @returns {Object} 客户端池对象，包含pool数组和getClinet方法
 */
export function initClientPool(cookies){
  let currentIndex = 0;
  const pool = cookies.map(cookie=>{
    const jar = new CookieJar();
    
    // 解析cookie字符串，确保正确设置到jar中
    const cookiePairs = cookie.split(';').map(pair => pair.trim());
    cookiePairs.forEach(pair => {
      jar.setCookie(
        pair,
        'https://edith.xiaohongshu.com',
        { ignoreError: true }
      );
      jar.setCookie(
        pair,
        'https://www.xiaohongshu.com',
        { ignoreError: true }
      );
    });

    const axios = wrapper(axiosDefault.create({
      jar,
      headers
    }));

    const instance = axios.create({
      baseURL: 'https://edith.xiaohongshu.com',
      withCredentials: true
    });

    return {
      cookie,
      instance,
      jar
    };
  });

  return {
    pool,
    getClinet(repeatClinet){
      if(repeatClinet) currentIndex = currentIndex-1;
      currentIndex = (currentIndex + 1) % pool.length;
      return pool[currentIndex];
    },
  };
}

/**
 * 获取主评论
 * @param {Object} pool - 客户端池
 * @param {string} noteId - 笔记ID
 * @param {string} xsec_token - 安全令牌
 * @param {string} cursor - 分页游标
 * @returns {Promise<Object>} 评论数据对象
 */
export async function fetchCommentPage(client, noteId, xsec_token, cursor) {
  try {
    const params = {
      note_id: noteId,
      cursor,
      top_comment_id: '',
      image_formats: 'jpg,webp,avif',
      xsec_token: xsec_token
    };

    const response = await client.instance.get('/api/sns/web/v2/comment/page', {
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

/**
 * 发送OPTIONS预检请求
 * @param {Object} client - 客户端实例
 * @param {string} url - 请求URL
 * @returns {Promise<void>}
 */
async function sendOptionsRequest(client, url, params) {
  try {
    // 打印当前cookie
    const jar = client.jar;
    await jar.setCookie(
      "acw_tc=001", // 强制重置acw_tc
      'https://edith.xiaohongshu.com',
      { ignoreError: true }
    );
    const response = await client.instance.options(url, {
      params,
      headers: {
        ...options_headers,
      }
    });
    // 检查并处理新的Cookie
    const newCookies = response.headers['set-cookie'];
    if (newCookies && Array.isArray(newCookies)) {
      // 获取当前实例的jar
      const jar = client.jar;
      // 将新的cookie添加到jar中
      for (const cookie of newCookies) {
        await jar.setCookie(
          cookie,
          'https://edith.xiaohongshu.com',
          { ignoreError: true }
        );
        await jar.setCookie(
          cookie,
          'https://www.xiaohongshu.com',
          { ignoreError: true }
        );
      }
      
      console.log('已更新Cookie');
    }

    return response;
  } catch (error) {
    console.error('OPTIONS预检请求失败:', error.message);
    throw error; // 向上抛出错误以便调用方处理
  }
}

/**
 * 获取子评论
 * @param {Object} client - 客户端实例
 * @param {string} noteId - 笔记ID
 * @param {string} xsec_token - 安全令牌
 * @param {string} root_comment_id - 父评论ID
 * @param {string} cursor - 分页游标
 * @returns {Promise<Object>} 子评论数据对象
 */
export async function fetchSubCommentPage(client, noteId, xsec_token, root_comment_id, cursor) {
  try {
    const params = {
      note_id: noteId,
      root_comment_id,
      num: 10,
      cursor,
      image_formats: 'jpg,webp,avif',
      top_comment_id: '',
      xsec_token: xsec_token
    };

    // 先发送OPTIONS预检请求
    const url = '/api/sns/web/v2/comment/sub/page';
    await sendOptionsRequest(client, url, params);
    
    // 然后发送实际的GET请求
    const response = await client.instance.get(url, {
      params,
      timeout: 5000,
      validateStatus: (status) => status < 400 || status === 403
    });

    if(response.data.success) {
      return response.data.data;
    } else {
      console.error(response.data);
      throw new Error(response);
    }
  } catch (error) {
    console.error(`子评论请求失败: ${error.message}`);
    // 返回空对象避免解构错误
    return { comments: [], cursor: null, has_more: false };
  }
}

/**
 * 从路径中提取24位十六进制格式的ID
 * @param {string} path - URL路径
 * @returns {string|null} 提取的ID或null
 */
export function extractIdFromPath(path) {
  const parts = path.split('/');
  for (const part of parts) {
    if (/^[a-f0-9]{24}$/.test(part)) {
      return part;
    }
  }
  return null;
}

/**
 * 手动跟踪重定向获取最终URL
 * @param {Object} pool - 客户端池
 * @param {string} url - 初始URL
 * @returns {Promise<string>} 重定向后的最终URL
 * @throws {Error} 超过最大重定向次数或缺少重定向位置时抛出错误
 */
export async function getRedirectedUrl(client, url) {

  let currentUrl = url;
  let redirectCount = 0;
  const maxRedirects = 10;

  while (redirectCount < maxRedirects) {
    const response = await client.instance.get(currentUrl, {
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

/**
 * 获取URL参数(ID和xsec_token)
 * @param {Object} pool - 客户端池
 * @param {string} url - 笔记链接
 * @returns {Promise<Object>} 包含id和xsec_token的对象
 */
export async function getUrlParams(pool, url) {
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
  const finalUrl = await getRedirectedUrl(pool, url);
  const finalParsed = new URL(finalUrl);
  const finalId = extractIdFromPath(finalParsed.pathname);
  const finalToken = finalParsed.searchParams.get('xsec_token');

  if (!finalId || !finalToken) {
    console.warn('链接访问不了',finalId, finalToken)
    return {
      id:finalId,
      xsec_token:finalToken
    }
  }
  console.log('跟踪重定向',finalId,finalToken)
  return { id: finalId, xsec_token: finalToken };
}

export function parseXHSURL(urlString) {
  try {
    const url = new URL(urlString);
    
    // 提取路径中的笔记ID（适配两种URL格式）
    const pathSegments = url.pathname.split('/');
    const noteId = pathSegments.find(seg => 
      seg.startsWith('www.xiaohongshu.com/explore/') || // 小红书ID常见前缀
      seg.match(/^[0-9a-f]{24}$/i) // 24位HEX格式ID
    );
    
    // 解析查询参数（兼容双重编码情况）
    const queryParams = {};
    const decodedSearch = decodeURIComponent(url.search).replace(/^\?/, ''); // 转义问号
    new URLSearchParams(decodedSearch).forEach((value, key) => {
      // 修复点2：智能解码保留原始值
      queryParams[key] = value.includes('%') ? 
        decodeURIComponent(value.replace(/\+/g, '%20')) : 
        value;
    });

    // 结构化返回结果
    return {
      baseUrl: `${url.protocol}//${url.host}`,
      pathType: pathSegments.includes('discovery') ? 'discovery' : 'explore',
      noteId: noteId || null,
      params: {
        source: queryParams.source || null,
        xhsshare: queryParams.xhsshare || null,
        xsec_token: queryParams.xsec_token || null,
        xsec_source: queryParams.xsec_source || null,
        // 其他参数保留原始数据
        extended: Object.fromEntries(
          Object.entries(queryParams)
            .filter(([k]) => !['source','xhsshare','xsec_token','xsec_source'].includes(k))
        )
      }
    };
  } catch (e) {
    console.error('URL解析错误:', e);
    return null;
  }
}