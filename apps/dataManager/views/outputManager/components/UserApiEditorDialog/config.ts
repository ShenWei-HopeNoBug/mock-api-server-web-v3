import { cloneDeep } from 'lodash-es';
import qs from 'qs';
import { isJsonString } from '@/utils';
import { isPlainObject } from 'lodash-es';

/** 新增接口时的默认表单值 */
const getDefaultFormValues = (): Record<string, any> => ({
  type: 'USER',
  method: 'GET',
  params: '{}',
  response: '{}',
  timeout: 0,
});

/**
 * 提交前统一处理表单数据。
 *
 * 核心规则：
 * 1. 固定写入 `type: 'USER'`；
 * 2. `params/response` 统一序列化为合法 JSON 字符串；
 * 3. 当 method 为 GET 时，将 params 展开到 url query，并同步回写 params（值统一转 string）。
 *
 * @param form BaseForm 输出的原始表单数据
 * @returns 发送给 add/edit 接口的标准化参数
 */
const processBeforeSubmit = (form: Record<string, any> = {}): Record<string, any> => {
  const formCp = cloneDeep(form);

  // MITMPROXY 类型仅允许编辑 timeout，其余字段不提交
  if (formCp.type === 'MITMPROXY') {
    return {
      timeout: formCp.timeout || 0,
    };
  }

  // USER 类型：遍历表单字段，规范格式后提交
  const submitForm: Record<string, any> = {};

  // 按表单字段提取并规范 JSON 字段格式
  Object.keys(formCp).forEach(key => {
    // type 字段固定不可编辑，不提交
    if (key === 'type') {
      return;
    }

    const value = formCp[key];
    if (key === 'params' || key === 'response') {
      submitForm[key] = isJsonString(value) ? JSON.stringify(JSON.parse(value)) : '{}';
      return;
    }

    if (key === 'timeout') {
      submitForm[key] = typeof value === 'number' ? value : Number(value) || 0;
      return;
    }

    submitForm[key] = value;
  });

  /**
   * GET 请求参数展开逻辑：
   * - 先去掉 url 上原有 query，仅保留纯路径；
   * - 再把 params 对象展开成 query 字符串；
   * - 同时将 params 中的值全部转为 string，保持与历史行为一致。
   */
  if (submitForm.method === 'GET') {
    const url = String(submitForm.url ?? '').trim();
    const pureUrl = url.split('?')[0];
    const params: Record<string, any> = isJsonString(submitForm.params)
      ? JSON.parse(submitForm.params)
      : {};
    const paramsObj: Record<string, string> = {};

    if (isPlainObject(params)) {
      Object.keys(params).forEach(key => {
        paramsObj[key] = String(params[key]);
      });
    }

    const query: string = qs.stringify(paramsObj, { addQueryPrefix: true });

    submitForm.url = pureUrl + query;
    submitForm.params = JSON.stringify(paramsObj);
  }

  return submitForm;
};

/** BaseForm 布局配置 */
const formProps: Record<string, any> = {
  labelCol: { span: 3 },
  wrapperCol: { span: 21 },
};

export { getDefaultFormValues, processBeforeSubmit, formProps };
