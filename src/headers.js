
export default {
    'authority': 'edith.xiaohongshu.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  }

export const options_headers = {
  'pragma': 'no-cache',
  'cache-control': 'no-cache',
  'accept': '*/*',
  'access-control-request-method': 'GET', // CORS 预检专用头
  'access-control-request-headers': 'x-b3-traceid,x-mns,x-s,x-s-common,x-t,x-xray-traceid', // CORS 预检专用头
  'origin': 'https://www.xiaohongshu.com',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-fetch-dest': 'empty',
  'referer': 'https://www.xiaohongshu.com/',
  'accept-encoding': 'gzip, deflate, br, zstd',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
  'priority': 'u=1, i'
}