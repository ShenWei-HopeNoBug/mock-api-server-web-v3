import type { MockRequestTesterType } from './components/MockRequestTester/type';

export const freedomTester: MockRequestTesterType.Option = {
  title: '自由测试',
  url: '/api/mock_tester/slow-api',
  method: 'GET',
  params: '{}',
  defaultExpanded: true,
};

export const testerList: MockRequestTesterType.Option[] = [
  {
    title: 'GET 无参数 —— 用户列表',
    url: '/api/mock_tester/users',
    method: 'GET',
    params: '{}',
    defaultExpanded: false,
  },
  {
    title: 'GET 带 query 参数 —— 分页查询',
    url: '/api/mock_tester/users',
    method: 'GET',
    params: '{"page":"1","size":"10"}',
    defaultExpanded: false,
  },
  {
    title: 'POST JSON body —— 创建用户',
    url: '/api/mock_tester/users',
    method: 'POST',
    contentType: 'application/json',
    params: '{"name":"Charlie","age":28}',
    defaultExpanded: false,
  },
  {
    title: 'POST 表单提交 —— 登录',
    url: '/api/mock_tester/login',
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    params: '{"username":"admin","password":"123456"}',
    defaultExpanded: false,
  },
  {
    title: '带自定义超时 —— 模拟慢接口',
    url: '/api/mock_tester/slow-api',
    method: 'GET',
    params: '{}',
    defaultExpanded: false,
  },
];
