// antd 暖调主题 token：与 mock-api-server 仓 config/theme.py PALETTE 同源
// 挂载方式：<a-config-provider :theme="qtWarmTheme">（App.vue 顶层）
// 手码场景（scrollbar/视图边角样式）用 variables.scss 的 $qt-* 变量，两边色值需同步
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';

export const qtWarmTheme: ThemeConfig = {
  token: {
    // 主色：hover/active 档位由 antd 算法自动派生
    colorPrimary: '#cd8c41', // ACCENT
    colorInfo: '#cd8c41',
    colorLink: '#be6e28', // LINK

    // 状态色
    colorSuccess: '#5aaa5a', // STATUS_ON
    colorWarning: '#e6a03c', // STATUS_WAIT
    colorError: '#c83c3c', // ICON_DANGER

    // 文字
    colorTextBase: '#603e1e', // TEXT
    colorTextHeading: '#7a4c24', // TITLE
    colorTextSecondary: 'rgba(96, 62, 30, 0.65)', // TEXT 弱化
    colorTextDisabled: '#a58c73', // DISABLED_TEXT

    // 背景
    colorBgLayout: '#ffe8c3', // WINDOW_BG
    colorBgContainer: '#fff8e1', // PANEL_BG：卡片/输入框/表格体
    colorBgElevated: '#fff8e1', // 浮层：dropdown/popconfirm/tooltip
    colorBgContainerDisabled: '#faf2e4', // DISABLED_BG

    // 描边与分隔
    colorBorder: '#c3945f', // BORDER
    colorBorderSecondary: 'rgba(160, 120, 70, 0.27)', // BORDER_SOFT
    colorSplit: 'rgba(122, 76, 36, 0.2)', // DIVIDER

    // 列表项底色（select 下拉/table 行/menu）
    // hover 取 PANEL_BG 与 PANEL_SELECT 之间的派生中档——PANEL_HOVER #fff5e1 与容器底仅差 3 亮度单位，实测不可见
    controlItemBgHover: '#ffe9c8',
    controlItemBgActive: '#ffe0b2', // PANEL_SELECT（深于 hover 一档，保持状态层级）

    // alter 填充（表格表头 tableHeaderBg、斑马纹等）：ACCENT 低透明叠 PANEL_BG ≈ #ffe0b2 观感的暖调
    colorFillAlter: 'rgba(205, 140, 65, 0.18)',

    borderRadius: 4, // 对齐 Qt 控件圆角
  },
  components: {
    // antd-vue 4.x 组件级 ComponentToken 为空接口，仅支持按组件覆写 alias token
    // Button 默认钮底/边/字已由 colorBgContainer/colorBorder/colorText 命中，此处仅补 BTN_BG 更白的差异
    Button: {
      colorBgContainer: '#fffcf6', // BTN_BG
    },
    // Table 表头暖调由 colorFillAlter 覆盖；Modal 头底/标题色已由 colorBgElevated/colorTextHeading 命中
  },
};
