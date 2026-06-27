import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function collectJsonFiles(dir) {
	const results = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...collectJsonFiles(full));
		} else if (entry.isFile() && entry.name.endsWith('.json')) {
			results.push(full);
		}
	}
	return results;
}

/**
 * Remove trailing commas from JSON text.
 * Uses a loop because removing one can expose another in nested structures.
 */
function removeTrailingCommas(text) {
	let prev;
	let result = text;
	do {
		prev = result;
		result = result.replace(/,(\s*[}\]])/g, '$1');
	} while (result !== prev);
	return result;
}

function main() {
	const dir = path.join(root, 'src/data');

	console.log('');
	console.log('  🔍 扫描 JSON 文件语法...');

	const files = collectJsonFiles(dir);
	let fixed = 0;
	let ok = 0;
	const errors = [];

	for (const file of files) {
		const content = fs.readFileSync(file, 'utf-8');
		const cleaned = removeTrailingCommas(content);

		if (cleaned !== content) {
			// 有尾部逗号，验证修复后的 JSON
			try {
				JSON.parse(cleaned);
				fs.writeFileSync(file, cleaned, 'utf-8');
				fixed++;
				const rel = path.relative(root, file);
				console.log(`  🔧 修复尾部逗号: ${rel}`);
			} catch (e) {
				errors.push(`${file}: 自动修复后仍然无法解析 — ${e.message}`);
			}
		} else {
			// 没有尾部逗号，但还是要严格验证一下语法
			try {
				JSON.parse(content);
				ok++;
			} catch (e) {
				errors.push(`${file}: ${e.message}`);
			}
		}
	}

	if (errors.length) {
		console.error(`\n  ❌ JSON 语法错误 (${errors.length} 个):\n`);
		for (const err of errors) {
			console.error(`    - ${err}`);
		}
		process.exit(1);
	}

	if (fixed > 0) {
		console.log(`  ✅ 已自动修复 ${fixed} 个文件`);
	} else {
		console.log(`  ✅ 所有 ${ok} 个 JSON 文件语法正确，无需修复`);
	}
}

main();
