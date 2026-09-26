import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';

const CLI = join(import.meta.dir, 'cli.ts');
const FIXTURE = join(import.meta.dir, '../test/fixtures/mail');

function run(...args: string[]) {
	const result = Bun.spawnSync([process.execPath, CLI, ...args], {
		cwd: FIXTURE,
	});
	return {
		code: result.exitCode,
		stdout: result.stdout.toString(),
		stderr: result.stderr.toString(),
	};
}

describe('nxgt-mail', () => {
	test('--help prints the usage and exits 0', () => {
		const { code, stdout } = run('--help');
		expect(code).toBe(0);
		expect(stdout).toStartWith('Usage: nxgt-mail <command> [options]');
	});

	test('an unknown option is a message and the usage, not a stack', () => {
		const { code, stderr } = run('build', '--bogus');
		expect(code).toBe(1);
		expect(stderr).toStartWith("nxgt-mail: Unknown option '--bogus'");
		expect(stderr).toContain('Usage: nxgt-mail');
		expect(stderr).not.toContain('    at ');
	});

	test('an unknown command', () => {
		const { code, stderr } = run('deploy');
		expect(code).toBe(1);
		expect(stderr).toStartWith('nxgt-mail: unknown command deploy');
	});

	test('a config that does not exist', () => {
		const { code, stderr } = run('build', '--config', 'missing.config.ts');
		expect(code).toBe(1);
		expect(stderr).toBe('nxgt-mail: missing.config.ts does not exist\n');
	});

	test('--out given to build', () => {
		const { code, stderr } = run('build', '--out', 'x');
		expect(code).toBe(1);
		expect(stderr).toStartWith(
			"nxgt-mail: --out is for dev — build writes where the config's out says",
		);
	});
});
