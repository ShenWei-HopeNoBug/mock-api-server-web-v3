/**
 * 注册 jump-forbid，阻止容器内 a 标签点击自动跳转
 * 使用指令 v-jump-forbid="callback"
 */
const installJumpForbidDirective = (app: any): void => {
  if (!app) {
    return;
  }

  app.directive('jump-forbid', {
    mounted(el: any, binding: any) {
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
        if (typeof binding?.value === 'function') {
          binding.value(event);
        }
      };

      el.addEventListener('click', clickHandler);
      // 把监听器挂在 dom 节点上
      el.JUMP_FORBID_HANDLER = clickHandler;
    },
    beforeUnmount(el: any) {
      if (el.JUMP_FORBID_HANDLER) {
        el.removeEventListener('click', el.JUMP_FORBID_HANDLER);
        el.JUMP_FORBID_HANDLER = null;
      }
    },
  });
};

export default installJumpForbidDirective;
