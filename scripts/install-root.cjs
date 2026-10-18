// install-root.cjs — npm 12+ workaround for EALLOWSCRIPTS
//
// Same issue as install-frontend.cjs: `npm run` exports user .npmrc entries such
// as `allow-scripts=...` as npm_config_allow_scripts, and npm 12+ treats that
// env var as the --allow-scripts CLI flag, rejecting it in project-scoped
// installs (EALLOWSCRIPTS).
//
// `npm run setup` used to call `npm install` directly, so the root install hit
// this error before install-frontend.cjs ever ran. Route it through here too.
const { spawnSync } = require('child_process');

delete process.env.npm_config_allow_scripts;

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCmd, ['install'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`Failed to run npm: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
