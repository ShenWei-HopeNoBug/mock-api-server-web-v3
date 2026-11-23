// 仅对「工作区改动文件」执行 eslint / prettier 检查（staged + unstaged + untracked，
// 即 git diff HEAD + 未跟踪文件）。全量检查仍用 npm run lint:check / format:check。
// 用法：node scripts/checkChanged.mjs <lint|format>
/* eslint-disable no-console -- CLI 脚本，console 即输出通道 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';

const require = createRequire(import.meta.url);

const MODE = process.argv[2];
if (MODE !== 'lint' && MODE !== 'format') {
  console.error('用法: node scripts/checkChanged.mjs <lint|format>');
  process.exit(2);
}

const git = args =>
  execFileSync('git', ['-c', 'core.quotepath=false', ...args], { encoding: 'utf8' });

// HEAD 对比覆盖 staged+unstaged；ls-files 覆盖 untracked；ACMR 排除删除
const changed = new Set(
  [
    ...git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']).split('\n'),
    ...git(['ls-files', '--others', '--exclude-standard']).split('\n'),
  ]
    .map(f => f.trim())
    .filter(f => f && existsSync(f)),
);

const LINT_EXTS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

// 包根定位 bin：eslint9 exports 未暴露 ./bin/*，经 ./package.json 推包根再拼
const pkgDir = name => dirname(require.resolve(`${name}/package.json`));
const TOOLS = {
  // --no-warn-ignored：显式传入但被 eslint ignores 命中的文件静默跳过（types/、components.d.ts 等）
  lint: {
    bin: join(pkgDir('eslint'), 'bin', 'eslint.js'),
    args: ['--no-warn-ignored'],
    filter: f => LINT_EXTS.has(extname(f)),
  },
  // --ignore-unknown：md/scss 等照查，不支持的扩展静默跳过；.prettierignore 仍生效
  format: {
    bin: join(pkgDir('prettier'), 'bin', 'prettier.cjs'),
    args: ['--check', '--ignore-unknown'],
    filter: () => true,
  },
};

const tool = TOOLS[MODE];
const targets = [...changed].filter(tool.filter);

if (targets.length === 0) {
  console.log(`[checkChanged:${MODE}] 无匹配的改动文件，跳过`);
  process.exit(0);
}

console.log(`[checkChanged:${MODE}] 检查 ${targets.length} 个改动文件:`);
targets.forEach(f => console.log(`  ${f}`));

const { status } = spawnSync(process.execPath, [tool.bin, ...tool.args, ...targets], {
  stdio: 'inherit',
});
process.exit(status ?? 1);
