// 在文件顶部添加
import fs from 'fs';

/**
 * 获取指定文件夹下的所有子文件夹名称
 * @param dirPath 目标文件夹路径
 * @returns 子文件夹名称数组
 */
const getSubdirectories = (dirPath: string): string[] => {
  try {
    // 读取目录内容
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    // 筛选出所有子文件夹
    const subDirs: string[] = items.filter(item => item.isDirectory()).map(dir => dir.name);

    return subDirs;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
};

export const getAppEntryConfig = (): Record<string, string> => {
  const BASE_DIR: string = './apps';
  const subAppList: string[] = getSubdirectories(BASE_DIR);
  const entryConfig: Record<string, string> = {};
  subAppList.forEach(name => {
    entryConfig[name] = `${BASE_DIR}/${name}/index.html`;
  });
  return entryConfig;
};
