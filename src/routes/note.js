import express from 'express';
import { getNoteDetail } from '../main.js';
import { ResponseCode, success, fail } from '../utils/response.js';

const router = express.Router();

router.get('/detail', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.fail(ResponseCode.PARAM_ERROR, '缺少必要的 url 参数');
    }
    
    const noteDetail = await getNoteDetail(url);
    if (noteDetail.error) {
      return res.fail(ResponseCode.SERVER_ERROR, noteDetail.error);
    }
    
    res.success(noteDetail);
  } catch (error) {
    res.fail(ResponseCode.SERVER_ERROR, error.message);
  }
});

export default router;