<template>
  <div class="json-input" :class="{ 'full-screen-wrapper': isFullScreen }">
    <!-- 头部操作栏：包含复制按钮和全屏切换按钮 -->
    <div class="header">
      <div class="icon-button" title="复制" @click="onCopy">
        <CopyOutlined />
      </div>
      <div
        class="icon-button"
        :title="isFullScreen ? '退出全屏' : '全屏'"
        @click="toggleFullScreen"
      >
        <FullscreenOutlined v-if="!isFullScreen" />
        <FullscreenExitOutlined v-else />
      </div>
    </div>
    <!-- JSON 编辑器容器 -->
    <div class="code-editor-container" :style="codeEditorStyle">
      <JsonEditorVue
        v-model="editorValue"
        class="editor-container"
        v-bind="getBindAttrs('codeEditor', codeEditorBindAttrs)"
        @change="onEditorUpdate"
      />
    </div>
  </div>
</template>

<script lang="ts" setup name="JsonInput">
import { ref, watch, CSSProperties } from 'vue';
import { message } from 'ant-design-vue';
import { FullscreenOutlined, FullscreenExitOutlined, CopyOutlined } from '@ant-design/icons-vue';
import { isJsonString, copyText, safeJsonParse } from '@/utils';
import type { JsonInputType } from './type';
import { defaultAttrsMap } from './config';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

/**
 * 组件属性接口
 */
interface Props {
  /** 输入值，可以是 JSON 字符串或对象 */
  value?: string;
  /** JSON 编辑器的绑定属性 */
  codeEditorBindAttrs?: JsonInputType.CodeEditorAttrs;
  /** 复制按钮的配置选项 */
  copyButtonOptions?: JsonInputType.ButtonOptions;
  /** 代码编辑器的样式 */
  codeEditorStyle?: CSSProperties;
  /** 默认复制内容，当 JSON 无效时使用 */
  defaultCopyContent?: string;
  /** 是否只读，为 true 时编辑器不可编辑 */
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  codeEditorBindAttrs: () => ({}),
  codeEditorStyle: () => ({}),
  defaultCopyContent: '',
  readonly: false,
});

const emits = defineEmits<{
  (e: 'change', value: string): void;
  (e: 'update:value', value: string): void;
}>();

// 内部状态：存储 JSON 字符串值
const valueRef = ref<string>('{}');
// 内部状态：存储 JSON 编辑器的对象值
const editorValue = ref<any>({});
// 内部状态：是否全屏
const isFullScreen = ref(false);

/**
 * 触发值变更事件
 */
const onChange = () => {
  emits('change', valueRef.value);
  emits('update:value', valueRef.value);
};

/**
 * 解析编辑器值为 JSON 对象
 * @param val - 待解析的 JSON 字符串
 * @returns 解析后的 JSON 对象，如果无效则返回空对象
 */
const parseEditorValue = (val: string) => {
  return safeJsonParse(val, {});
};

/**
 * 获取合并后的绑定属性
 * 将默认属性与自定义属性合并，自定义属性优先级更高
 * @param type - 属性类型，对应 defaultAttrsMap 的键
 * @param bindAttrs - 自定义绑定属性
 * @returns 合并后的属性对象
 */
const getBindAttrs = (type: keyof typeof defaultAttrsMap, bindAttrs: Record<string, any> = {}) => {
  const defaultAttrs = defaultAttrsMap[type] || {};
  const elemAttrs = bindAttrs || {};
  const result: Record<string, any> = {
    ...defaultAttrs,
    ...elemAttrs,
  };

  if (type === 'codeEditor' && props.readonly) {
    result.options = {
      ...(result.options || {}),
      /**
       * 禁用编辑器编辑功能，实现类似 readonly 的效果
       * */
      onEditable: () => false,
    };
  }

  return result;
};

/**
 * 刷新编辑器
 * 重新解析当前值并更新编辑器显示
 */
const refresh = () => {
  editorValue.value = parseEditorValue(valueRef.value);
};

/**
 * 验证当前值是否为有效的 JSON 字符串
 * @returns 是否为有效的 JSON 字符串
 */
const validate = () => isJsonString(valueRef.value);

/**
 * 处理复制按钮点击事件
 * 如果当前值是有效的 JSON，则复制格式化后的 JSON
 * 否则复制默认内容
 */
const onCopy = async () => {
  const content = isJsonString(valueRef.value)
    ? JSON.stringify(JSON.parse(valueRef.value))
    : props.defaultCopyContent;
  try {
    await copyText(content);
    message.success(t('global.toast.copySuccess'));
  } catch (e) {
    console.warn('onCopy error', e);
    message.error(t('global.toast.copyFailed'));
  }
};

/**
 * 处理编辑器值更新事件
 * 将编辑器的对象值转换为 JSON 字符串并触发变更事件
 */
const onEditorUpdate = () => {
  const stringifyValue = JSON.stringify(editorValue.value, null, 2);
  if (typeof stringifyValue !== 'string') {
    return;
  }

  valueRef.value = stringifyValue;
  onChange();
};

/**
 * 切换全屏状态
 */
const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

/**
 * 监听 value 变化
 * 当外部传入的值变化时，同步更新内部状态
 */
watch(
  () => props.value,
  val => {
    if (typeof val !== 'string') {
      onChange();
      return;
    }

    valueRef.value = val;
    editorValue.value = parseEditorValue(val);
  },
  { immediate: true },
);

/**
 * 暴露给父组件的方法
 */
defineExpose({
  refresh,
  validate,
});
</script>

<style scoped lang="scss">
.json-input {
  width: 100%;
  position: relative;

  .header {
    width: 100%;
    margin-bottom: 10px;
    display: flex;
    justify-content: flex-start;
    overflow: hidden;

    .icon-button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #1890ff;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      user-select: none;

      &:not(:first-child) {
        margin-left: 8px;
      }

      &:hover {
        background-color: #40a9ff;
      }

      &:active {
        background-color: #096dd9;
      }
    }
  }

  .code-editor-container {
    width: 100%;

    .editor-container {
      width: 100%;
      height: 100%;
      min-height: 280px;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      :deep(.full-screen) {
        display: none;
      }
    }

    :deep(.container) {
      .json-editor-vue {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .jsoneditor-menu {
          .jsoneditor-frame {
            display: flex;
            align-items: center;
            border-radius: 4px;

            input {
              background-color: transparent;
            }
          }

          a {
            display: none;
          }
        }

        .jsoneditor {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 4px;

          .jsoneditor-outer {
            flex: 1;
            width: 100%;
            height: 100%;
            overflow: hidden;

            & > .jsoneditor-tree {
              flex: 1;
              width: 100%;
              height: 100%;
              overflow: hidden;
              overflow-y: auto;
            }
          }
        }
      }
    }
  }
}

.full-screen-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  width: 100% !important;
  height: 100% !important;
  background-color: #fff;
  padding: 24px;

  display: flex;
  flex-direction: column;

  .code-editor-container {
    flex: 1;
    height: 100%;
    overflow: hidden;

    .editor-container {
      height: 100%;
      min-height: 100%;
    }
  }
}
</style>
