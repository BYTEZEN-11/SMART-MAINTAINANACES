

const { run } = require('./_testRunner');

require('./httpClient.test.js');
require('./apiClient.test.js');

(async () => {
  await run();
})();