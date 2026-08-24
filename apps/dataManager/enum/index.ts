import type { CommonType } from '#/common';
import { createLabelMapFromValueEnum } from '@/utils';

export const API_TYPE_ENUM: CommonType.EnumItem[] = [
  { label: 'USER', value: 'USER' },
  { label: 'MITMPROXY', value: 'MITMPROXY' },
  { label: 'MCP', value: 'MCP' },
];

export const METHOD_ENUM: CommonType.EnumItem[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
];

export const REQUEST_CONTENT_TYPE_ENUM: CommonType.EnumItem[] = [
  { label: 'NONE', value: 'NONE' },
  { label: 'APPLICATION_JSON', value: 'APPLICATION_JSON' },
  { label: 'MULTIPART_FORM_DATA', value: 'MULTIPART_FORM_DATA' },
  { label: 'APPLICATION_X_WWW_FORM_URLENCODED', value: 'APPLICATION_X_WWW_FORM_URLENCODED' },
];

export const ENABLED_ENUM: CommonType.EnumItem[] = [
  { label: '启用', value: true },
  { label: '禁用', value: false },
];

export const ENABLED_LABEL_MAP: Record<string, string> = createLabelMapFromValueEnum(ENABLED_ENUM);
