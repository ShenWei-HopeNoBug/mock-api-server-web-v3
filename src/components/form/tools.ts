import type { CSSProperties } from 'vue';
import type { Form as FormType, CommonObject } from '@/components/form/types';
import { getInputDefaultPropsMap } from '@/components/form/InputRender/config.ts';
import { defaultFormProps } from '@/components/form/BaseForm/config.ts';
import dayjs from 'dayjs';
import i18n from '@/locales';

// 获取表单输入框 props
export const getFormInputProps = (options: FormType.FormInputOptions): CommonObject => {
  const inputType = options?.inputType ?? '';
  const inputProps = options?.inputProps ?? {};
  const inputDefaultPropsMap = getInputDefaultPropsMap();
  const defaultProps = inputDefaultPropsMap[inputType];
  return { ...defaultProps, ...inputProps };
};

// 合并 a-form 透传参数
export const getFormProps = (props: CommonObject = {}): CommonObject => {
  return { ...defaultFormProps, ...props };
};

// 获取表单滚动样式
export const getFormScrollStyle = (scroll: FormType.FormScroll): CSSProperties => {
  const y = scroll?.y ?? 0;
  if (!y) {
    return {};
  }

  if (typeof y === 'number') {
    return {
      maxHeight: `${y}px`,
      overflowY: 'auto',
    };
  } else if (typeof y === 'string') {
    return {
      maxHeight: y,
      overflowY: 'auto',
    };
  } else {
    return {};
  }
};

// 获取日期选择预设配置
export const getRangePickerPresets = () => {
  const current = dayjs();

  return [
    {
      label: i18n.global.t('global.form.preset.today'),
      value: [current.clone().startOf('day'), current],
    },
    {
      label: i18n.global.t('global.form.preset.lastDay'),
      value: [current.clone().subtract(1, 'day').startOf('day'), current],
    },
    {
      label: i18n.global.t('global.form.preset.lastWeek'),
      value: [current.clone().subtract(1, 'week').startOf('day'), current],
    },
    {
      label: i18n.global.t('global.form.preset.lastTwoWeeks'),
      value: [current.clone().subtract(Number('2'), 'week').startOf('day'), current],
    },
    {
      label: i18n.global.t('global.form.preset.lastMonth'),
      value: [current.clone().subtract(1, 'month').startOf('day'), current],
    },
    {
      label: i18n.global.t('global.form.preset.lastThreeMonths'),
      value: [current.clone().subtract(Number('3'), 'month').startOf('day'), current],
    },
    {
      label: i18n.global.t('global.form.preset.lastSixMonths'),
      value: [current.clone().subtract(Number('6'), 'month').startOf('day'), current],
    },
  ];
};

// 获取日期选择预设配置
export const getRangePickerRanges = () => {
  const current = dayjs();

  return {
    [i18n.global.t('global.form.preset.today')]: [current.clone().startOf('day'), current],
    [i18n.global.t('global.form.preset.lastDay')]: [
      current.clone().subtract(1, 'day').startOf('day'),
      current,
    ],
    [i18n.global.t('global.form.preset.lastWeek')]: [
      current.clone().subtract(1, 'week').startOf('day'),
      current,
    ],
    [i18n.global.t('global.form.preset.lastTwoWeeks')]: [
      current.clone().subtract(Number('2'), 'week').startOf('day'),
      current,
    ],
    [i18n.global.t('global.form.preset.lastMonth')]: [
      current.clone().subtract(1, 'month').startOf('day'),
      current,
    ],
    [i18n.global.t('global.form.preset.lastThreeMonths')]: [
      current.clone().subtract(Number('3'), 'month').startOf('day'),
      current,
    ],
    [i18n.global.t('global.form.preset.lastSixMonths')]: [
      current.clone().subtract(Number('6'), 'month').startOf('day'),
      current,
    ],
  };
};
