export declare namespace JsonInputType {
  /**
   * 按钮配置选项接口
   */
  interface ButtonOptions {
    text?: string;
    bindAttrs?: Record<string, any>;
  }

  type CodeEditorMode = 'tree' | 'code' | 'form' | 'view';

  interface CodeEditorOptions {
    onEditable?: () => boolean;
  }

  interface CodeEditorAttrs {
    currentMode?: CodeEditorMode;
    modeList?: CodeEditorMode[];
    options?: CodeEditorOptions;
    [key: string]: any;
  }
}
