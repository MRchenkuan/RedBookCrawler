// 代理支持
import { HttpsProxyAgent } from 'https-proxy-agent';

// 在实例配置中添加
const agent = new HttpsProxyAgent('http://proxy.example.com:8080');

// 请求拦截器
instance.interceptors.request.use(config => {
  config.headers['x-timestamp'] = Date.now();
  return config;
});

// 响应拦截器
instance.interceptors.response.use(response => {
  console.log(`请求耗时: ${Date.now() - response.config.headers['x-timestamp']}ms`);
  return response;
}, error => {
  if (error.code === 'ECONNABORTED') {
    console.log('请求超时');
  }
  return Promise.reject(error);
});