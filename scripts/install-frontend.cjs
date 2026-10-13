// install-frontend.cjs — npm 12+ workaround for EALLOWSCRIPTS
//
// `npm run` exports every npm config (including user .npmrc entries such as
// `allow-scripts=@kilocode/cli`) as npm_config_* environment variables.
// npm 12+ treats an allow_scripts env var as the --allow-scripts CLI flag and
// rejects it in project-scoped installs (EALLOWSCRIPTS), even when
// frontend/package.json already declares a valid allowScripts field.
//
// Deleting the env var here and spawning npm in a clean environment restores
// the documented resolution order (.npmrc cascade / package.json allowScripts).
const { spawnSync } = require('child_process');

delete process.env.npm_config_allow_scripts;

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCmd, ['--prefix', 'frontend', 'install'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`Failed to run npm: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
