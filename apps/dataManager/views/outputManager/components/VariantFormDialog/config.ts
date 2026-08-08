import { cloneDeep } from 'lodash-es';
import { isJsonString } from '@/utils';

/** 新增变体时的默认表单值 */
const getDefaultVariantValues = (): Record<string, any> => ({
  name: '',
  response: '{}',
  timeout: 0,
});

/**
 * 提交前统一处理变体表单数据。
 *
 * 核心规则：
 * 1. response 统一序列化为合法 JSON 字符串；
 * 2. timeout 转为数字。
 *
 * @param form 表单输出的原始数据
 * @returns 发送给新增/更新接口的标准化参数
 */
const processBeforeSubmit = (form: Record<string, any> = {}): Record<string, any> => {
  const formCp = cloneDeep(form);
  const submitForm: Record<string, any> = {};

  Object.keys(formCp).forEach(key => {
    const value = formCp[key];

    if (key === 'response') {
      submitForm[key] = isJsonString(value) ? JSON.stringify(JSON.parse(value)) : '{}';
      return;
    }

    if (key === 'timeout') {
      submitForm[key] = typeof value === 'number' ? value : Number(value) || 0;
      return;
    }

    submitForm[key] = value;
  });

  return submitForm;
};

/** BaseForm 布局配置 */
const formProps: Record<string, any> = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

/** 变体列表表格列配置 */
const variantTableColumns = [
  { title: '', key: 'dragHandle', width: 48, align: 'center' as const },
  { title: '变体名称', dataIndex: 'name', key: 'name', width: 160, ellipsis: true },
  { title: '响应延时(ms)', dataIndex: 'timeout', key: 'timeout', width: 120 },
  { title: '启用状态', dataIndex: 'enabled', key: 'enabled', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
  { title: '操作', key: 'operation', width: 200, fixed: 'right' as const },
];

export { getDefaultVariantValues, processBeforeSubmit, formProps, variantTableColumns };
