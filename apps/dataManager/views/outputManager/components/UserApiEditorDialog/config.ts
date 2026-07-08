import { cloneDeep } from 'lodash-es';
import qs from 'qs';
import { isJsonString } from '@/utils';
import type { UserApiEditorDialogType } from './type';
import { isPlainObject } from 'lodash-es';

const userApiEditFormColumns: UserApiEditorDialogType.FormColumns = [
  {
    required: true,
    label: 'Url',
    key: 'url',
    inputType: 'textarea',
  },
  {
    required: true,
    label: 'Method',
    key: 'method',
    inputType: 'select',
    options: [
      {
        label: 'GET',
        value: 'GET',
      },
      {
        label: 'POST',
        value: 'POST',
      },
    ],
  },
  {
    slot: true,
    required: true,
    label: 'Params',
    key: 'params',
    inputType: '#input#',
  },
  {
    slot: true,
    required: true,
    label: 'Response',
    key: 'response',
    inputType: '#input#',
  },
];

const getDefaultFormValues = (): Record<string, any> => ({
  method: 'GET',
  params: '{}',
  response: '{}',
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
  const submitForm: Record<string, any> = { type: 'USER' };
  const keyList = userApiEditFormColumns.map(item => item.key);

  // 按配置项提取字段，并规范 JSON 字段格式
  keyList.forEach(key => {
    const value = formCp[key];
    if (key === 'params' || key === 'response') {
      submitForm[key] = isJsonString(value) ? JSON.stringify(JSON.parse(value)) : '{}';
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

const formProps: Record<string, any> = {
  labelCol: { span: 3 },
  wrapperCol: { span: 21 },
};

export { userApiEditFormColumns, getDefaultFormValues, processBeforeSubmit, formProps };
