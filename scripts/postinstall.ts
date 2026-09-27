#!/usr/bin/env bun

/**
 * Runs `bun run editor` after `bun install`: the build, then `maizzle
 * prepare` in the fixtures and in examples/starter, so an editor resolves the
 * packages through their `dist/` and knows `t` and `brand` in the templates.
 *
 * It never fails the install. A package that does not build — a branch
 * half-way through a change — must not stop `bun install` or `bun add`; the
 * editor's types are then stale, and this says so. CI skips it: it builds as
 * a step of its own, where a failure is reported as a build failure.
 */

if (process.env.CI) {
	process.exit(0);
}

const run = Bun.spawnSync(['bun', 'run', 'editor'], {
	stdout: 'inherit',
	stderr: 'inherit',
});

if (run.exitCode !== 0) {
	console.warn(
		'\nThe editor types were not refreshed: a package did not build. Fix it, then run `bun run editor`.',
	);
}
