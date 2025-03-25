import note_list from '../data/note_list.js';
import { saveCommentsCSV } from './csv_tool.js';
import cookies from '../data/cookie.js';
import { 
  initClientPool, 
  fetchCommentPage, 
  fetchSubCommentPage,
  getUrlParams, 
  initClientPoolWithNoneCookies,
  fetchUrlContent
} from './utils.js';
import * as cheerio from 'cheerio';

// 爬取间隔
const duration_note = 1000;      // 主贴
const duration_comment = 2500;   // 评论
const duration_subcomment = 2500;// 子评论

// 保存数据
let page = 100, t, c_list = [];

// let note_list = [
//   "https://www.xiaohongshu.com/explore/67ab33ea000000002503f275?xsec_token=MBoD6W-urgGzvAgfhI-85PeN55uQMlb3ZYhEMKmBuU0_o=&xsec_source=pc_pgyexport"
// ];

// 初始化客户端池
const pool = initClientPool(cookies);
const poolWithNoneCookies = initClientPoolWithNoneCookies(7);

/**
 * 获取笔记的评论
 * @param {string} noteId - 笔记ID
 * @param {string} xsec_token - 安全令牌
 * @param {number} totalComments - 已获取的评论总数
 * @returns {Promise<number>} 获取的评论数量
 */
async function getComments(client, noteId, xsec_token, c='', totalComments = 0) {
  let pageCommentCount = 0;
  
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const { cursor, comments, has_more, xsec_token:xsec_token_new,user_id } = await fetchCommentPage(client, noteId, xsec_token, c) || {};
        
        if (!comments || comments.length === 0) {
          console.log('未获取到评论数据或评论为空');
          return resolve(totalComments);
        }
        
        let sub_comments = [];
        let mainCommentCount = comments.length;
        let subCommentTotalCount = 0;

        // 处理评论和子评论
        for (const comment of comments) {
          comment.user_info = comment.user_info.nickname;
          sub_comments = sub_comments.concat(comment.sub_comments);
          
          if(comment.sub_comment_has_more) {
            // 获取子评论并记录数量
            const subCommentCount = await getMoreSubComments(client, noteId, xsec_token, comment.id, comment.sub_comment_cursor);
            subCommentTotalCount += subCommentCount;
          }
        }
        
        // 处理子评论
        if (sub_comments.length) {
          sub_comments.forEach(it => {
            it.user_info = it.user_info.nickname;
            it.target_comment_id = it.target_comment.id;
          });
          comments.push(...sub_comments);
          subCommentTotalCount += sub_comments.length;
        }
  
        c_list.push(...comments);
        pageCommentCount = comments.length;
        
        // 当前累计评论总数
        const currentTotal = totalComments + pageCommentCount;
        
        console.log(`- 当前评论分页获取主评论 ${mainCommentCount} 条，子评论 ${subCommentTotalCount} 条，总计 ${pageCommentCount} 条`);
        console.log(`- 当前笔记累计获取评论总数: ${currentTotal} 条`);
        
        // 大于3000条分个文件
        if (c_list.length > 3000) {
          await saveCommentsCSV(c_list);
          console.log('Comment data:>3000, save', c_list.length);
          c_list = [];
        }
        
        if (!has_more) {
          return resolve(currentTotal);
        }

        
        if (page-- > 0) {
          // 递归调用并累加评论数量
          const finalTotal = await getComments(client, noteId, xsec_token, cursor, currentTotal);
          resolve(finalTotal);
        } else {
          console.log(`已达到最大页数限制，笔记 ${noteId} 共获取 ${currentTotal} 条评论`);
          resolve(currentTotal);
        }
      } catch (e) {
        console.error('获取评论出错:', e);
        if (c_list.length > 0) {
          try {
            await saveCommentsCSV(c_list);
            console.log('错误情况下保存数据', c_list.length);
            c_list = [];
          } catch (saveError) {
            console.error('保存评论时出错:', saveError);
          }
        }
        console.log(`评论获取出错，已获取 ${totalComments} 条评论`);
        reject(e);
      }
    }, duration_comment);
  });
}

/**
 * 读取并处理链接列表
 * @param {Array<string>} note_list - 笔记链接列表
 * @param {number} i - 当前处理的索引
 * @returns {Promise<void>}
 */
async function readLink(note_list, i) {
  const client = pool.getClinet();
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        if (i <= 0) {
          if (c_list.length > 0) {
            await saveCommentsCSV(c_list);
            console.log('所有链接处理完毕，保存剩余评论', c_list.length);
            c_list = [];
          }
          return resolve();
        }
        
        const currentLink = note_list[note_list.length - i];        
        const {id:noteId, xsec_token} = await getUrlParams(client, currentLink);
        let linkCommentCount = 0;
        
        if (noteId && xsec_token) {
          linkCommentCount = await getComments(client, noteId, xsec_token);
          console.log(`链接 ${currentLink} 爬取完成，获取评论数:`, linkCommentCount);
        }
        
        console.log(`已抓取评论${c_list.length}; ${note_list.length - i + 1}/${note_list.length}`);
        
        // 重置页面和游标
        page = 100;        
        // 超过阈值保存
        if (c_list.length > 5000) {
          await saveCommentsCSV(c_list);
          console.log('评论数量超过5000，保存数据', c_list.length);
          c_list = [];
        }
        
        await readLink(note_list, i - 1);
        resolve();
      } catch (e) {
        if (c_list.length > 0) {
          try {
            await saveCommentsCSV(c_list);
            console.log('错误情况下保存数据', c_list.length);
            c_list = [];
          } catch (saveError) {
            console.error('保存评论时出错:', saveError);
          }
        }
        console.error('处理链接出错:', e);
        reject(e);
      }
    }, duration_note);
  });
}

/**
 * 获取更多子评论
 * @param {string} noteId - 笔记ID
 * @param {string} xsec_token - 安全令牌
 * @param {string} id - 父评论ID
 * @param {string} sub_comment_cursor - 子评论分页游标
 * @returns {Promise<number>} 获取的子评论数量
 */
async function getMoreSubComments(client, noteId, xsec_token, id, sub_comment_cursor, totalSubComments = 0) {
  try {
    const {
      comments:sub_comments, 
      cursor:cursor_sub, 
      has_more:has_more_sub
    } = await fetchSubCommentPage(client, noteId, xsec_token, id, sub_comment_cursor) || {};
    
    if (!sub_comments || sub_comments.length === 0) {
      console.log(`- 评论ID ${id} 的子评论获取完成，共获取 ${totalSubComments} 条子评论`);
      return totalSubComments;
    }
    
    sub_comments.forEach(it => {
      it.user_info = it.user_info.nickname;
      it.target_comment_id = id;
    });
    
    c_list.push(...sub_comments);
    
    // 累加当前批次的子评论数量
    const currentTotal = totalSubComments + sub_comments.length;
    
    if (has_more_sub) {
      return new Promise(resolve => {
        setTimeout(async () => {
          // 递归调用并累加子评论数量
          const finalTotal = await getMoreSubComments(client, noteId, xsec_token, id, cursor_sub, currentTotal);
          resolve(finalTotal);
        }, duration_subcomment);
      });
    } else {
      // 没有更多子评论时，打印总数并返回
      console.log(`- 评论ID ${id} 的子评论获取完成，共获取 ${currentTotal} 条子评论`);
      return currentTotal;
    }
  } catch (error) {
    console.error('- 获取子评论出错:', error);
    console.log(`- 评论ID ${id} 的子评论获取出错，已获取 ${totalSubComments} 条子评论`);
    return totalSubComments;
  }
}

// 修改getComments函数中调用getMoreSubComments的部分
// 对note_list进行去重处理
export async function walkComments() {
  const uniqueNoteList = [...new Set(note_list)];
  console.log(`原始链接数量: ${note_list.length}, 去重后链接数量: ${uniqueNoteList.length}`);
  // 遍历 (使用去重后的链接列表)
  try {
    await readLink(uniqueNoteList, uniqueNoteList.length);
    // 确保最后一次保存
    if (c_list.length > 0) {
      await saveCommentsCSV(c_list);
      console.log('爬取完成，保存最后的数据', c_list.length);
      c_list = [];
    }
  } catch (error) {
    console.error('爬取过程中出错:', error);
    // 确保错误情况下也保存数据
    if (c_list.length > 0) {
      await saveCommentsCSV(c_list);
      c_list = [];
    }
  }
}


export async function getNoteDetail(link, retryCount = 0) {
  async function fetchAndParse(client, url) {
    const result = await fetchUrlContent(client, url);
    
    if (!result.response) {
      throw new Error('请求失败，无响应数据');
    }

    const requestCookies = client.jar.getCookiesSync('https://www.xiaohongshu.com');
    const cookieString = requestCookies.map(cookie => `${cookie.key}=${cookie.value}`).join('; ');
    const $ = cheerio.load(result.response.data);
    
    // 检查是否需要登录
    if (result.url.includes('login?redirectPath')) {
      throw new Error('需要登录认证');
    }

    const title = $('meta[property="og:title"]').attr('content') || 
                 $('.note-scroller .note-content #detail-title').text().trim() || '';
    
    // 如果标题为空，可能需要使用新的URL重试
    if (!title && retryCount < 2) {
      const finalParsed = new URL(result.url);
      const finalId = extractIdFromPath(finalParsed.pathname);
      const finalToken = finalParsed.searchParams.get('xsec_token');
      
      if (finalId && finalToken) {
        const newUrl = `https://www.xiaohongshu.com/explore/${finalId}?xsec_token=${finalToken}`;
        return getNoteDetail(newUrl, retryCount + 1);
      }
    }

    return {
      url: result.url,
      cookieString,
      title,
      desc: $('meta[property="og:description"]').attr('content') || 
            $('.note-scroller .note-content #detail-desc').text().trim() || '',
      date: $('.note-scroller .note-content .bottom-container .date').text().trim() || 
            $('.date').text().trim() || '',
      method: client.cookie ? 'auth' : 'normal'
    };
  }

  try {
    // 先尝试无cookie请求
    let client = poolWithNoneCookies.getClinet();
    try {
      return await fetchAndParse(client, link);
    } catch (error) {
      if (error.message === '需要登录认证') {
        // 使用带cookie的客户端重试
        client = pool.getClinet();
        return await fetchAndParse(client, link);
      }
      throw error; // 其他错误直接抛出
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error.message);
    return {
      title: '获取笔记详情失败',
      desc: error.message,
      date: '',
      url: link,
      cookieString: '',
      error: error.message
    };
  }
}

// const result = await getNoteDetail('https://www.xiaohongshu.com/discovery/item/67b8386e000000001203fabe?app_platform=ios&app_version=8.16&share_from_user_hidden=true&xsec_source=app_share&type=normal&xsec_token=CBovxHE7VBDG9BGCIeX7srUJgEmyqUpwz67gtPN13o_Pc=&author_share=1&xhsshare=CopyLink&appuid=6237f0e50000000021029363&apptime=1740237438');

