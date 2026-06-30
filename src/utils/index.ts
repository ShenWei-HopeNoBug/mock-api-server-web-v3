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
