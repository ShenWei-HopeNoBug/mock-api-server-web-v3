import type { CommonObject } from '@/components/form/types';
import i18n from '@/locales';

const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

const inputTypeSet = new Set([
  'input',
  'textarea',
  'select',
  'rangePicker',
  'datePicker',
  'inputNumber',
]);

const getInputDefaultPropsMap = (): CommonObject => ({
  // 输入框
  input: {
    placeholder: i18n.global.t('global.form.placeholder.enter'),
    allowClear: true,
  },
  textarea: {
    placeholder: i18n.global.t('global.form.placeholder.enter'),
    allowClear: true,
  },
  // 选择器
  select: {
    placeholder: i18n.global.t('global.form.placeholder.select'),
    showSearch: true,
    allowClear: true,
    filterOption,
  },
  // 时间范围选择
  rangePicker: {
    placeholder: [
      i18n.global.t('global.form.placeholder.startDate'),
      i18n.global.t('global.form.placeholder.endDate'),
    ],
    style: { width: '100%' },
  },
  // 时间选择器
  datePicker: {
    placeholder: i18n.global.t('global.form.placeholder.select'),
    style: { width: '100%' },
  },
  // 数字输入
  inputNumber: {
    placeholder: i18n.global.t('global.form.placeholder.enter'),
  },
});

export { inputTypeSet, getInputDefaultPropsMap };
