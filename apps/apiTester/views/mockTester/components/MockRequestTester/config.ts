import type { MockRequestTesterType } from './type';

const methodOptions: { label: string; value: MockRequestTesterType.Method }[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
];

const contentTypeOptions: { label: string; value: MockRequestTesterType.ContentType }[] = [
  { label: 'application/json', value: 'application/json' },
  { label: 'multipart/form-data', value: 'multipart/form-data' },
  { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
];

export { methodOptions, contentTypeOptions };
