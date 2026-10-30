import type { App, DirectiveBinding } from 'vue';

const handlers = new WeakMap<Element, EventListener>();

/**
 * 注册 jump-forbid，阻止容器内 a 标签点击自动跳转
 * 使用指令 v-jump-forbid="callback"
 */
const installJumpForbidDirective = (app: App): void => {
  app.directive('jump-forbid', {
    mounted(el: Element, binding: DirectiveBinding) {
      const clickHandler = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (!target) {
          return;
        }

        const anchorEl = target.closest('a');
        if (!anchorEl || !el.contains(anchorEl)) {
          return;
        }

        event.preventDefault();
        if (typeof binding.value === 'function') {
          binding.value(event);
        }
      };

      el.addEventListener('click', clickHandler);
      // 记录监听器，便于卸载时清理
      handlers.set(el, clickHandler);
    },
    beforeUnmount(el: Element) {
      const handler = handlers.get(el);
      if (handler) {
        el.removeEventListener('click', handler);
        handlers.delete(el);
      }
    },
  });
};

export default installJumpForbidDirective;
