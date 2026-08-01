import type { CommonType } from '#/common';

export const API_TYPE_ENUM: CommonType.EnumItem[] = [
  { label: 'USER', value: 'USER' },
  { label: 'MITMPROXY', value: 'MITMPROXY' },
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
