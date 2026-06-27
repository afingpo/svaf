import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function run(cmd, args, label) {
	console.log(`\n═══════════════════════════════════════`);
	console.log(`   ${label}`);
	console.log(`═══════════════════════════════════════\n`);

	const result = spawnSync(cmd, args, {
		cwd: root,
		stdio: 'inherit',
		shell: true
	});

	if (result.status !== 0) {
		console.error(`\n  ❌ ${label} 失败，退出码 ${result.status}\n`);
		process.exit(result.status);
	}

	console.log(`  ✅ ${label} 完成\n`);
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`   SVAF 预构建流水线`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

const start = Date.now();

run('node', ['scripts/clean-unused-images.js', '--yes'], '步骤 1/5：清理未引用图片');
run('node', ['scripts/sanitize-filenames.js'],           '步骤 2/5：规范化文件名');
run('node', ['scripts/strict-json.js'],                  '步骤 3/5：严格 JSON 校验');
run('pnpm', ['exec', 'vite', 'build'],                    '步骤 4/5：Vite 构建');
run('node', ['scripts/post-images.js'],                   '步骤 5/5：图片 AVIF 转换');

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`   全部完成，耗时 ${elapsed}s`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
