import axios from 'axios';

import { saveCommentsCSV, saveCommentsCSV2 } from './csv_tool.js';


const authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvbGF5X2NzIiwiZXhwIjoxNzQ0NTI0MjYzfQ.CyCdLRTNO6yJ4AfedXlXuo7bxnZyx8K0meuSV4NiVrI`;
const headers = {

}
/**
 * 初始化客户端
 */
function initClientPool(){
  const instance = axios.create({
    baseURL: 'https://ai-scrm.com',
    headers:{
      ...headers,
      'Authorization':authorization
    }
  });

  return instance
}

const instance = initClientPool();




// API请求函数
export async function fetchCommentPage(params) {
  try {
    const response = await instance.get('api/track/content-comments', {
      params,
      timeout: 5000,
      validateStatus: (status) => status < 400 || status === 403
    });

    if(response.data) {
      return response.data 
    }else {
      console.error(response.data);
      throw new Error(response);
    }
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
  }
}


let page = 100, c, t, c_list = []

async function getComments(duration,params) {
  setTimeout(async () => {
    try{
      if(!params){
        params = {
          page: 1,
          size:100,
          source:'submit',
          platform:'xhs'
        }
      }
      let {results, page, size, total} = await fetchCommentPage(params) || {};

      results = results.map(it=>{
        
        return {
          ...it,
          content_info:JSON.stringify(it.content_info),
          user:JSON.stringify(it.user)
        }
      })
      c_list = c_list.concat(results);
      // 大于5000条分个文件
      if(c_list.length>3000){
        await saveCommentsCSV2(c_list);
        console.log('Comment data:>5000, save', c_list.length);
        c_list = [];
      }
      if(Math.floor(total/size)<=page) return;
      params.page++
      console.log('继续爬取',params)
      await getComments(duration, params)
    }catch(e){
      console.error(e)
      await saveCommentsCSV2(c_list);
      c_list=[];
    }
  }, duration);
}


// 遍历
getComments(1000)
if(c_list.length){
  saveCommentsCSV2(c_list);
  c_list=[]
}



