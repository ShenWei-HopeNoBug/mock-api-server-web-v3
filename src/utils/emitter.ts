/*
 * Vue3的全局事件总线
 * */

import mitt from 'mitt';

type Events = Record<string, unknown>;

const emitter = mitt<Events>();
export default emitter;
