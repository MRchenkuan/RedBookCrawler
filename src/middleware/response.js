import { ResponseCode } from '../utils/response.js';

export default function() {
  return (req, res, next) => {
    res.success = function(data = null) {
      return this.json({
        code: ResponseCode.SUCCESS,
        msg: 'success',
        data,
        success: true
      });
    };

    res.fail = function(code, msg, data = null) {
      return this.json({
        code,
        msg,
        data,
        success: false
      });
    };

    next();
  };
}