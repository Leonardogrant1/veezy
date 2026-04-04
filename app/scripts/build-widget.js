#!/usr/bin/env node

/**
 * Widget-only prebuild script.
 *
 * Uses @bacons/apple-targets' prebuild-blank template but patches the
 * Podfile to include `use_expo_modules!` — required by plugins like
 * react-native-appsflyer that modify the Podfile via dangerous mods.
 *
 * Also resolves the template path correctly in a monorepo with hoisted deps.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Locate the blank template (monorepo: may be in root node_modules)
const candidates = [
    path.resolve(__dirname, '../node_modules/@bacons/apple-targets/prebuild-blank.tgz'),
    path.resolve(__dirname, '../../node_modules/@bacons/apple-targets/prebuild-blank.tgz'),
];
const templatePath = candidates.find(fs.existsSync);
if (!templatePath) {
    console.error('❌ Could not find prebuild-blank.tgz in node_modules');
    process.exit(1);
}
console.log(`📦 Using template: ${templatePath}`);

// Work in a temp directory
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'widget-tpl-'));
const extractDir = path.join(tmpDir, 'extracted');
const patchedTgz = path.join(tmpDir, 'patched.tgz');

try {
    fs.mkdirSync(extractDir);

    // Extract template
    execSync(`tar -xzf "${templatePath}" -C "${extractDir}"`);

    // Find the Podfile (might be at root or inside a subdirectory)
    const findPodfile = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name === 'ios') {
                const pf = path.join(full, 'Podfile');
                if (fs.existsSync(pf)) return pf;
            }
            if (entry.isDirectory()) {
                const found = findPodfile(full);
                if (found) return found;
            }
        }
        return null;
    };

    const podfilePath = findPodfile(extractDir);
    if (podfilePath) {
        let content = fs.readFileSync(podfilePath, 'utf8');
        if (!content.includes('use_expo_modules!')) {
            // Define use_expo_modules! as no-op (blank template doesn't include
            // the Expo Ruby helpers, but plugins like AppsFlyer need this anchor)
            const noopDef = `\ndef use_expo_modules!; end\n\n`;
            content = noopDef + content;
            // Insert call + project ref inside the target block
            content = content.replace(
                /(target\s+['"](\w+)['"]\s+do\n)/,
                `$1  project '$2.xcodeproj'\n  use_expo_modules!\n`
            );
            fs.writeFileSync(podfilePath, content);
            console.log('✅ Patched Podfile with use_expo_modules! (no-op)');
        }
    } else {
        console.warn('⚠️  No Podfile found in template, skipping patch');
    }

    // Repackage from inside extractDir so paths are relative
    execSync(`tar -czf "${patchedTgz}" -C "${extractDir}" .`);

    // Run prebuild
    console.log('🔨 Running expo prebuild with patched template...\n');
    execSync(`npx expo prebuild --template "${patchedTgz}" --clean`, {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
    });
} finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
}
