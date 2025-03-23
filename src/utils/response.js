export const ResponseCode = {
  SUCCESS: 0,
  PARAM_ERROR: 400,
  SERVER_ERROR: 500
};

export function success(data = null) {
  return {
    code: ResponseCode.SUCCESS,
    msg: 'success',
    data,
    success: true
  };
}

export function fail(code, msg, data = null) {
  return {
    code,
    msg,
    data,
    success: false
  };
}