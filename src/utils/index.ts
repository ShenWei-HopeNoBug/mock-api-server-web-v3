// 限制数值的范围
export const limitNumRange = (num: number, min: number, max: number) => {
  let numCp = num;
  if (numCp < min) {
    numCp = min;
  }
  if (num > max) {
    numCp = max;
  }

  return numCp;
};

export const isJsonString = (v: any): boolean => {
  try {
    if (typeof v !== 'string') {
      return false;
    }

    JSON.parse(v);
    return true;
  } catch (e) {
    return false;
  }
};

export const safeJsonParse = <T = any>(v: any, fallback: T): T => {
  try {
    if (typeof v !== 'string') {
      return fallback;
    }

    return JSON.parse(v) as T;
  } catch (e) {
    return fallback;
  }
};

// 复制文本到剪贴板
export const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

// 生成uuid
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
};
