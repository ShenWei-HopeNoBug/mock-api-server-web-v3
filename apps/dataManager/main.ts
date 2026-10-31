import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import i18n from '@/locales';
import router from './router';

// 重置浏览器默认样式
import '@/styles/reset.css';
// antdv 4.x：组件样式由 cssinjs 运行时注入，无需手动引入；
// 模板内 <a-*> 组件由 unplugin-vue-components 按需自动引入；
// DatePicker/RangePicker 面板中文文案依赖 dayjs locale
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import '@/styles/global.scss';
import installDomResizeDirective from '@/utils/installDomResizeDirective';
import installDomExposureDirective from '@/utils/installDomExposureDirective';
import installJumpForbidDirective from '@/utils/installJumpForbidDirective';
import JsonEditorVue from 'json-editor-vue3';

dayjs.locale('zh-cn');

const app = createApp(App);
const pinia = createPinia();

// 注册 v-dom-resize 的 v 指令
installDomResizeDirective(app);
// 注册 v-dom-exposure 的 v 指令
installDomExposureDirective(app);
// 注册 v-jump-forbid 的 v 指令
installJumpForbidDirective(app);

app.use(pinia);
app.use(i18n);
app.use(router);
app.component('JsonEditorVue', JsonEditorVue);
// 注意：ant-design-vue 组件通过 unplugin-vue-components 按需自动引入，
// 无需 app.use(Antd) 全量注册，避免打包体积膨胀。

app.mount('#app');
