import { computed, ref } from 'vue';
import type { DataManagerType } from '#/qt/dataManager';
import { API_TYPE_ENUM, METHOD_ENUM, REQUEST_CONTENT_TYPE_ENUM } from '@apps/dataManager/enum';
import type { Form as FormType } from '@/components/form/types';

/**
 * 管理 UserApiEditorDialog 表单列配置。
 * recordType 驱动 isMitmproxy，控制部分字段 disabled 状态。
 */
export const useFormColumns = () => {
  /** 数据来源类型 */
  const recordType = ref<DataManagerType.ApiType>('USER');
  /** 是否为 MITMPROXY 类型 */
  const isMitmproxy = computed<boolean>(() => recordType.value === 'MITMPROXY');
  /** 当前请求类型 */
  const method = ref<string>('GET');
  /** 请求 Content-Type 可选列表，随 method 动态变化 */
  const requestContentTypeOptions = computed(() => {
    if (method.value === 'GET') {
      return REQUEST_CONTENT_TYPE_ENUM.filter(item => item.value === 'NONE');
    }
    if (method.value === 'POST') {
      return REQUEST_CONTENT_TYPE_ENUM.filter(item => item.value !== 'NONE');
    }
    return [];
  });
  /** 表单列配置，MITMPROXY 时部分字段禁用编辑 */
  const formColumns = computed<FormType.FormItemOptions[]>(() => [
    {
      required: true,
      label: '数据来源',
      key: 'type',
      inputType: 'select',
      options: API_TYPE_ENUM,
      inputProps: {
        disabled: true,
      },
    },
    {
      required: true,
      label: '请求Url',
      key: 'url',
      inputType: 'textarea',
      inputProps: {
        disabled: isMitmproxy.value,
      },
    },
    {
      required: true,
      label: '请求类型',
      key: 'method',
      inputType: 'select',
      options: METHOD_ENUM,
      inputProps: {
        disabled: isMitmproxy.value,
      },
      onChange: ctx => {
        // 切换请求类型时，同步 method 并清空 Content-Type 字段
        method.value = ctx.value;
        if (!ctx?.formState) {
          return;
        }

        // 切换请求类型时，同步 Content-Type 默认选中值
        if (method.value === 'GET') {
          ctx.formState.request_content_type = 'NONE';
        } else if (method.value === 'POST') {
          ctx.formState.request_content_type = 'APPLICATION_JSON';
        } else {
          ctx.formState.request_content_type = undefined;
        }
      },
    },
    {
      required: true,
      label: 'Content-Type',
      key: 'request_content_type',
      inputType: 'select',
      options: requestContentTypeOptions.value,
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
      label: '请求参数',
      key: 'params',
      inputType: '#input#',
      inputProps: {
        disabled: isMitmproxy.value,
      },
    },
    {
      slot: true,
      required: true,
      label: '响应数据',
      key: 'response',
      inputType: '#input#',
      inputProps: {
        disabled: isMitmproxy.value,
      },
    },
  ]);

  return { recordType, isMitmproxy, formColumns };
};
