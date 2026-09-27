/**
 * `maizzle serve` for a build spec: on a port the system hands out, answered
 * only once it serves, and stopped by the caller.
 *
 * A random port in a fixed range let two packages' specs, run in parallel,
 * reach each other's server — a 404 or another project's list, read as this
 * one's. A port the system gives is free when asked; readiness is polled with
 * a pause after every miss, and a server that exits says why.
 *
 * The same file is in mail-i18n, mail-presets and mail-ui, each package's
 * specs compiling only its own files; scripts/maizzle-serve.spec.ts keeps
 * the three identical.
 */

export interface MaizzleServer {
	/** `http://localhost:<port>`, with no trailing slash. */
	readonly origin: string;
	stop(): Promise<void>;
}

const READY = '/__maizzle/templates';

function freePort(): number {
	const probe = Bun.serve({ port: 0, fetch: () => new Response() });
	const port = probe.port;
	probe.stop(true);
	if (port === undefined) {
		throw new Error('maizzle-serve: the system handed out no port');
	}
	return port;
}

export async function serveMaizzle(
	maizzle: string,
	cwd: string,
	timeoutMs = 90_000,
): Promise<MaizzleServer> {
	const port = freePort();
	const child = Bun.spawn([maizzle, 'serve', '--port', String(port)], {
		cwd,
		stdout: 'ignore',
		stderr: 'pipe',
	});
	const origin = `http://localhost:${port}`;
	const stop = async () => {
		child.kill();
		await child.exited;
	};
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (child.exitCode !== null) {
			const stderr = await new Response(child.stderr).text();
			throw new Error(
				`maizzle-serve: maizzle serve exited with ${child.exitCode} in ${cwd}\n${stderr}`,
			);
		}
		const ok = await fetch(origin + READY)
			.then((response) => response.ok)
			.catch(() => false);
		if (ok) {
			return { origin, stop };
		}
		await Bun.sleep(250);
	}
	await stop();
	throw new Error(
		`maizzle-serve: maizzle serve did not answer ${READY} on port ${port} within ${timeoutMs} ms`,
	);
}
