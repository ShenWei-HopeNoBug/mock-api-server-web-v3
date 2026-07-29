import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import Antd from 'ant-design-vue';
import i18n from '@/locales';
import router from './router';

// 重置浏览器默认样式
import '@/styles/reset.css';
import 'ant-design-vue/dist/antd.css';
import '@/styles/global.scss';
import installDomResizeDirective from '@/utils/installDomResizeDirective';
import installDomExposureDirective from '@/utils/installDomExposureDirective';
import installJumpForbidDirective from '@/utils/installJumpForbidDirective';
import JsonEditorVue from 'json-editor-vue3';

const app = createApp(App);
const pinia = createPinia();

// 注册 v-dom-resize 的 v 指令
installDomResizeDirective(app);
// 注册 v-dom-exposure 的 v 指令
installDomExposureDirective(app);
// 注册 v-jump-forbid 的 v 指令
installJumpForbidDirective(app);

app.use(pinia);
app.use(Antd);
app.use(i18n);
app.use(router);
app.component('JsonEditorVue', JsonEditorVue);

app.mount('#app');
