import { limitNumRange } from '@/utils';

/**
 * 注册 dom-exposure，监听元素的可见性变化
 * 使用指令 v-dom-exposure:[arg].modifiers="callback"
 * [arg] threshold 出现在视口的比例
 * modifiers exposureOnce 第一次曝光后才触发回调，并解除可见性监听
 */
const installDomExposureDirective = (app: any): void => {
  if (!app) {
    return;
  }

  app.directive('dom-exposure', {
    mounted(el: any, binding: any) {
      // 没绑定回调函数，跳过
      if (typeof binding?.value !== 'function') {
        return;
      }

      const { exposureOnce } = binding.modifiers;
      let { threshold } = binding.arg || {};
      const defaultArgs = {
        threshold: 0.5,
      };

      if (typeof threshold === 'number') {
        threshold = limitNumRange(threshold, 0, 1);
      } else {
        threshold = defaultArgs.threshold;
      }

      const domObserver = new IntersectionObserver(
        entries => {
          // 解除监听
          const disconnectObserver = () => {
            domObserver.disconnect();
            el.DOM_EXPOSURE_OBSERVER = null;
          };

          entries.forEach(entry => {
            // 元素不存在，解除可见性监听
            if (!entry.target) {
              disconnectObserver();
              return;
            }

            // 配置了曝光一次
            if (exposureOnce) {
              if (entry.isIntersecting) {
                binding.value?.(entry);
                disconnectObserver();
              }
            } else {
              binding.value?.(entry);
            }
          });
        },
        {
          threshold,
        },
      );

      domObserver.observe(el);
      // 把监听器挂在 dom 节点上
      el.DOM_EXPOSURE_OBSERVER = domObserver;
    },
    beforeUnmount(el: any) {
      el.DOM_EXPOSURE_OBSERVER?.disconnect?.();
      el.DOM_EXPOSURE_OBSERVER = null;
    },
  });
};

export default installDomExposureDirective;
