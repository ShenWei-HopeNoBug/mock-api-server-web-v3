import type { App, DirectiveBinding } from 'vue';

const observers = new WeakMap<Element, ResizeObserver>();

/**
 * 注册 dom-resize，监听元素的尺寸变化
 * 使用指令 v-dom-resize:[arg].modifiers="callback"
 * modifiers once 是否只触发一次
 */
const installDomResizeDirective = (app: App): void => {
  app.directive('dom-resize', {
    mounted(el: Element, binding: DirectiveBinding) {
      // 没绑定回调函数，跳过
      if (typeof binding.value !== 'function') {
        return;
      }

      const { once } = binding.modifiers;
      const domObserver = new ResizeObserver(entries => {
        entries.forEach((entry: ResizeObserverEntry) => {
          // 元素不存在，解除尺寸监听
          if (!entry.target) {
            domObserver.disconnect();
            observers.delete(el);
            return;
          }

          binding.value(entry);

          // 只触发一次则解除监听
          if (once) {
            domObserver.disconnect();
            observers.delete(el);
          }
        });
      });

      domObserver.observe(el);
      // 记录监听器，便于卸载时清理
      observers.set(el, domObserver);
    },
    beforeUnmount(el: Element) {
      observers.get(el)?.disconnect();
      observers.delete(el);
    },
  });
};

export default installDomResizeDirective;
