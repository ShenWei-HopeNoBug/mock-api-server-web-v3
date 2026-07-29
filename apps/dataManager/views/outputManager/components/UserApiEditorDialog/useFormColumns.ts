import { computed, ref } from 'vue';
import type { DataManagerType } from '#/qt/dataManager';
import type { UserApiEditorDialogType } from './type';

/**
 * 管理 UserApiEditorDialog 表单列配置。
 * recordType 驱动 isMitmproxy，控制部分字段 disabled 状态。
 */
export const useFormColumns = () => {
  /** 数据来源类型 */
  const recordType = ref<DataManagerType.ApiType>('USER');
  /** 是否为 MITMPROXY 类型 */
  const isMitmproxy = computed<boolean>(() => recordType.value === 'MITMPROXY');
  /** 表单列配置，MITMPROXY 时部分字段禁用编辑 */
  const formColumns = computed<UserApiEditorDialogType.FormColumns>(() => [
    {
      required: true,
      label: 'Type',
      key: 'type',
      inputType: 'select',
      options: [
        { label: 'USER', value: 'USER' },
        { label: 'MITMPROXY', value: 'MITMPROXY' },
      ],
      inputProps: {
        disabled: true,
      },
    },
    {
      required: true,
      label: 'Url',
      key: 'url',
      inputType: 'textarea',
      inputProps: {
        disabled: isMitmproxy.value,
      },
    },
    {
      required: true,
      label: 'Method',
      key: 'method',
      inputType: 'select',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
      ],
      inputProps: {
        disabled: isMitmproxy.value,
      },
    },
    {
      required: true,
      label: '响应延时(ms)',
      key: 'timeout',
      inputType: 'inputNumber',
      inputProps: {
        min: 0,
        max: 120000,
        precision: 0,
      },
    },
    {
      slot: true,
      required: true,
      label: 'Params',
      key: 'params',
      inputType: '#input#',
      inputProps: {
        disabled: isMitmproxy.value,
      },
    },
    {
      slot: true,
      required: true,
      label: 'Response',
      key: 'response',
      inputType: '#input#',
      inputProps: {
        disabled: isMitmproxy.value,
      },
    },
  ]);

  return { recordType, isMitmproxy, formColumns };
};
