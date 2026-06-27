import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), 'src', 'content', 'posts');
const IMG_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.bmp']);

function getAllPosts() {
	const dirs = fs.readdirSync(postsDir, { withFileTypes: true });
	const posts = [];
	for (const d of dirs) {
		if (!d.isDirectory()) continue;
		if (fs.existsSync(path.join(postsDir, d.name, 'index.md'))) posts.push(d.name);
	}
	return posts;
}

function renameSafe(name) {
	const ext = path.extname(name);
	const base = path.basename(name, ext);
	const safe = base.replace(/[\s]+/g, '-').replace(/[()（）【】\[\]{}]+/g, '').replace(/-+/g, '-');
	if (safe === base) return null;
	return safe + ext;
}

function findConflicts(postsDir, slug, newName) {
	const imgDir = path.join(postsDir, slug, 'img');
	if (!fs.existsSync(imgDir)) return false;
	return fs.readdirSync(imgDir).includes(newName);
}

function main() {
	console.log('\n  🔍 扫描文件名中的空格...\n');

	const posts = getAllPosts();
	const changes = [];

	for (const slug of posts) {
		const mdPath = path.join(postsDir, slug, 'index.md');
		const imgDir = path.join(postsDir, slug, 'img');
		if (!fs.existsSync(imgDir)) continue;

		const files = fs.readdirSync(imgDir);
		for (const file of files) {
			const ext = path.extname(file).toLowerCase();
			if (!IMG_EXTS.has(ext)) continue;

			const newName = renameSafe(file);
			if (!newName) continue;

			if (findConflicts(postsDir, slug, newName)) {
				console.log(`  ⚠️   ${slug}/img/${file} → ${newName} 冲突，跳过`);
				continue;
			}

			changes.push({ slug, file, newName });
		}
	}

	if (changes.length === 0) {
		console.log('  ✅ 所有文件名均合法。\n');
		return;
	}

	console.log(`  发现 ${changes.length} 个含空格的文件：\n`);
	for (const { slug, file, newName } of changes) {
		console.log(`    ${slug}/img/${file}  →  ${newName}`);
	}

	console.log('\n  正在重命名并更新引用...\n');

	for (const { slug, file, newName } of changes) {
		const oldPath = path.join(postsDir, slug, 'img', file);
		const newPath = path.join(postsDir, slug, 'img', newName);
		fs.renameSync(oldPath, newPath);

		const mdPath = path.join(postsDir, slug, 'index.md');
		let content = fs.readFileSync(mdPath, 'utf-8');

		const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		const rawName = esc(file);
		const urlName = esc(encodeURIComponent(file));

		content = content
			.replace(new RegExp(`(\\(img/)${rawName}(\\))`, 'g'), `$1${newName}$2`)
			.replace(new RegExp(`(\\(img/)${urlName}(\\))`, 'g'), `$1${newName}$2`)
			.replace(new RegExp(`(src=["']img/)${rawName}(["'])`, 'g'), `$1${newName}$2`)
			.replace(new RegExp(`(src=["']img/)${urlName}(["'])`, 'g'), `$1${newName}$2`)
			.replace(new RegExp(`^(image:\\s*img/)${rawName}\\s*$`, 'm'), `$1${newName}`)
			.replace(new RegExp(`^(image:\\s*img/)${urlName}\\s*$`, 'm'), `$1${newName}`);

		fs.writeFileSync(mdPath, content, 'utf-8');
		console.log(`  ✅ ${slug}/img/${file}  →  ${newName}`);
	}

	console.log(`\n  ✅ 已完成 ${changes.length} 个文件的重命名。\n`);
}

main();
