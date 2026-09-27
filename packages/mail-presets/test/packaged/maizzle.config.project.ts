import type { MaizzleConfig } from '@maizzle/framework';
import config from './maizzle.config';

// The same build, with the project's components/nx-button.vue — the spec
// writes it — replacing ours inside the installed templates.
const project: MaizzleConfig = { ...config, output: { path: 'dist-project' } };

export default project;
