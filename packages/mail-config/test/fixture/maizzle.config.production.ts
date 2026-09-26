import { productionConfig } from '../../src/index';
import config from './maizzle.config';

export default productionConfig(config, {
	output: { path: 'dist-production' },
});
