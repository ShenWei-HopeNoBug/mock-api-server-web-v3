import type { App, DirectiveBinding } from 'vue';
import { limitNumRange } from '@/utils';

const observers = new WeakMap<Element, IntersectionObserver>();

const DEFAULT_THRESHOLD = 0.5;

// 指令 arg 参数对象，后续可按需扩展字段
interface DomExposureArg {
  /** 元素出现在视口的比例阈值，取值 0 ~ 1，默认 0.5 */
  threshold?: number;
}

/**
 * 注册 dom-exposure，监听元素的可见性变化
 * 使用指令 v-dom-exposure:[arg].modifiers="callback"
 * [arg] 参数对象，形如 v-dom-exposure:[{ threshold: 0.5 }]
 * modifiers exposureOnce 第一次曝光后才触发回调，并解除可见性监听
 */
const installDomExposureDirective = (app: App): void => {
  app.directive('dom-exposure', {
    mounted(el: Element, binding: DirectiveBinding) {
      // 没绑定回调函数，跳过
      if (typeof binding.value !== 'function') {
        return;
      }

      const { exposureOnce } = binding.modifiers;
      const arg = binding.arg as DomExposureArg | undefined;
      const threshold =
        typeof arg?.threshold === 'number' ? limitNumRange(arg.threshold, 0, 1) : DEFAULT_THRESHOLD;

      const domObserver = new IntersectionObserver(
        entries => {
          // 解除监听
          const disconnectObserver = () => {
            domObserver.disconnect();
            observers.delete(el);
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
                binding.value(entry);
                disconnectObserver();
              }
            } else {
              binding.value(entry);
            }
          });
        },
        {
          threshold,
        },
      );

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

export default installDomExposureDirective;
