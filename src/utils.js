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