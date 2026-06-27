import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const yesMode = process.argv.includes('--yes');

const postsDir = path.join(root, 'src', 'content', 'posts');
const backupDir = path.join(root, 'tmp', 'cleanup-backup');

const IMG_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.bmp']);

function getAllPosts() {
	const dirs = fs.readdirSync(postsDir, { withFileTypes: true });
	const posts = [];
	for (const d of dirs) {
		if (!d.isDirectory()) continue;
		const md = path.join(postsDir, d.name, 'index.md');
		if (fs.existsSync(md)) posts.push(d.name);
	}
	return posts;
}

function extractUsedImages(content) {
	const used = new Set();
	const addRef = (raw) => {
		const ref = raw.trim();
		if (!ref.startsWith('img/')) return;
		used.add(decodeURIComponent(ref.slice(4)));
	};
	const mdRe = /!\[.*?\]\(([^)]+)\)/g;
	let m;
	while ((m = mdRe.exec(content)) !== null) addRef(m[1]);
	const htmlRe = /<img[^>]+src=["']([^"']+)["']/gi;
	while ((m = htmlRe.exec(content)) !== null) addRef(m[1]);
	const fmRe = /^image:\s*(.+)$/m;
	const fm = content.match(fmRe);
	if (fm) addRef(fm[1]);
	return used;
}

function main() {
	console.log('\n  🔍 扫描未被文章引用的图片...\n');

	const posts = getAllPosts();
	if (posts.length === 0) {
		console.log('  未找到任何文章。\n');
		process.exit(0);
	}

	const orphans = [];

	for (const slug of posts.sort()) {
		const mdPath = path.join(postsDir, slug, 'index.md');
		const content = fs.readFileSync(mdPath, 'utf-8');
		const used = extractUsedImages(content);

		const imgDir = path.join(postsDir, slug, 'img');
		if (!fs.existsSync(imgDir)) continue;

		const files = fs.readdirSync(imgDir);
		for (const f of files) {
			const ext = path.extname(f).toLowerCase();
			if (!IMG_EXTS.has(ext)) continue;
			if (!used.has(f)) orphans.push({ slug, file: f });
		}
	}

	if (orphans.length === 0) {
		console.log('  ✅ 所有图片均有被引用，无需清理。\n');
		process.exit(0);
	}

	console.log(`  发现 ${orphans.length} 个未使用的图片：\n`);
	for (const { slug, file } of orphans) {
		console.log(`    ${slug}/img/${file}`);
	}

	const deleteFiles = () => {
		const timestamp = Date.now();
		const backupRoot = path.join(backupDir, String(timestamp));

		for (const { slug, file } of orphans) {
			const src = path.join(postsDir, slug, 'img', file);
			if (!fs.existsSync(src)) continue;

			const dest = path.join(backupRoot, slug, 'img');
			fs.mkdirSync(dest, { recursive: true });
			fs.copyFileSync(src, path.join(dest, file));
			fs.unlinkSync(src);
			console.log(`  🗑️   ${slug}/img/${file}`);
		}

		console.log(`\n  ✅ 已删除 ${orphans.length} 个文件，备份在 tmp/cleanup-backup/${timestamp}/\n`);
		process.exit(0);
	};

	if (yesMode) {
		deleteFiles();
	} else {
		console.log(`\n  ⚠️   操作前会自动备份到 tmp/cleanup-backup/`);
		console.log('  是否删除这些文件？(y/N): ');
		process.stdin.once('data', (buf) => {
			const answer = buf.toString().trim().toLowerCase();
			if (answer !== 'y' && answer !== 'yes') {
				console.log('\n  已取消。\n');
				process.exit(0);
			}
			deleteFiles();
		});
	}
}

main();
