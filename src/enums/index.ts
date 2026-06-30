/**
 * @description ContentTypeEnum
 */
export enum ContentTypeEnum {
  // form-urlencoded
  FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8',
  // form-data
  FORM_DATA = 'multipart/form-data;charset=UTF-8',
  // json
  JSON = 'application/json;charset=UTF-8',
}

/**
 * @description 与后端协定的状态码
 */
export enum ResponseCodeEnum {
  SUCCESS_CODE = 0, // 成功
}
