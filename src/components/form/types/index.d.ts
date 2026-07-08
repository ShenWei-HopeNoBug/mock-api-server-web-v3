export type CommonObject = Record<string, any>;

export declare namespace Form {
  type InputType =
    | 'input'
    | 'textarea'
    | 'select'
    | 'rangePicker'
    | 'datePicker'
    | 'inputNumber'
    | '#input#'
    | '#select#';

  // 表单主体内容区滚动参数
  interface FormScroll {
    y?: number | string; // 表单最小高度
  }

  // 表单输入框配置项
  interface FormInputOptions {
    inputType: InputType; // 输入框类型
    inputProps?: CommonObject; // 透传给输入框组件的属性
    options?: Array<CommonObject>; // select下拉列表枚举列表
  }

  // 表单元素配置项
  interface FormItemOptions extends FormInputOptions {
    key: string; // 表单键名
    label: string; // 表单输入框 label
    slot?: boolean; // 是否为插槽模式
    required?: boolean; // 是否必填
    rules?: CommonObject[]; // 完整校验规则（会覆盖内置规则）
    firstRule?: CommonObject; // 第一个校验规则（会和内置规则合并）
    extraRules?: CommonObject[]; // 额外补充的校验规则
  }
}
