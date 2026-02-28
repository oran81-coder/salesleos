import { app } from './app.js';
import { getAppConfig } from './config/env.js';

const config = getAppConfig();

const port = config.apiPort;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`);
});

