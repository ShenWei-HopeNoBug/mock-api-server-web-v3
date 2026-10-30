import type { CSSProperties } from 'vue';

export declare namespace InfoDescriptionType {
  interface InfoOptions {
    rowKey?: string;
    label: string;
    value: any;
    tooltip?: boolean;
    ellipsis?: boolean;
    slot?: boolean;
    extra?: Record<string, any>;
  }

  interface Props {
    columns: InfoOptions[];
    infoItemStyle?: CSSProperties;
    align?: 'between' | 'left';
  }
}
