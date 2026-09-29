import { productionConfig } from '@nxgt/mail-config';
import base from './maizzle.config';

// The base config minified: a row's cells sit side by side in the HTML.
export default productionConfig(base, { output: { path: 'dist-production' } });
