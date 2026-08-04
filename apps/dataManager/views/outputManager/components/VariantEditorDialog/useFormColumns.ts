import type { Form as FormType } from '@/components/form/types';

/**
 * 管理 VariantEditorDialog 表单列配置。
 */
export const useFormColumns = () => {
  const formColumns: FormType.FormItemOptions[] = [
    {
      required: true,
      label: '变体名称',
      key: 'name',
      inputType: 'input',
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
      label: '响应数据',
      key: 'response',
      inputType: '#input#',
    },
  ];

  return { formColumns };
};
