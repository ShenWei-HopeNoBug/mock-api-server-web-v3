import type { CommonObject } from '@/components/form/types';
import i18n from '@/locales';

// 表单校验message
const getRuleMessageMap = (): CommonObject => {
  const selectMsg = i18n.global.t('global.form.validation.select');
  const inputMsg = i18n.global.t('global.form.validation.enter');
  return {
    input: inputMsg,
    textarea: inputMsg,
    select: selectMsg,
    rangePicker: selectMsg,
    datePicker: selectMsg,
    inputNumber: inputMsg,
    '#input#': inputMsg,
    '#select#': selectMsg,
  };
};

// 默认的 a-form 透传参数
const defaultFormProps: CommonObject = {
  labelCol: { style: { width: '90px' } },
};

export { getRuleMessageMap, defaultFormProps };
