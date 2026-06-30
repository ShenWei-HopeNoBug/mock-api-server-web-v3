/**
 * 注册 dom-resize，监听元素的尺寸变化
 * 使用指令 v-dom-resize:[arg].modifiers="callback"
 * modifiers once 是否只触发一次
 */
const installDomResizeDirective = (app: any): void => {
  if (!app) {
    return;
  }

  app.directive('dom-resize', {
    mounted(el: any, binding: any) {
      // 没绑定回调函数，跳过
      if (typeof binding?.value !== 'function') {
        return;
      }

      const { once } = binding.modifiers;
      const domObserver = new ResizeObserver(entries => {
        entries.forEach((entry: ResizeObserverEntry) => {
          // 元素不存在或只监听一次，解除可见性监听
          if (!entry.target || once) {
            domObserver.disconnect();
            el.DOM_RESIZE_OBSERVER = null;
            return;
          }

          binding.value?.(entry);
        });
      });

      domObserver.observe(el);
      // 把监听器挂在 dom 节点上
      el.DOM_RESIZE_OBSERVER = domObserver;
    },
    beforeUnmount(el: any) {
      el.DOM_RESIZE_OBSERVER?.disconnect?.();
      el.DOM_RESIZE_OBSERVER = null;
    },
  });
};

export default installDomResizeDirective;
