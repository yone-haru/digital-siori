const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js pulls in @opentelemetry/api which uses dynamic
// import() — not supported by Hermes. Redirect all otel packages to an empty shim.
const emptyShim = path.resolve(__dirname, 'mocks/empty.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@opentelemetry/')) {
    return { type: 'sourceFile', filePath: emptyShim };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
