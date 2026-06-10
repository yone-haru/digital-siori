module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // @supabase/supabase-js's OpenTelemetry instrumentation uses
      // import(/* webpackIgnore: true */ '@opentelemetry/...') which Hermes
      // cannot parse. Replace those dynamic imports with Promise.resolve({}).
      function resolveOtelDynamicImports({ types: t }) {
        return {
          visitor: {
            CallExpression(path) {
              if (
                path.node.callee.type === 'Import' &&
                path.node.arguments[0]?.type === 'StringLiteral' &&
                path.node.arguments[0].value.startsWith('@opentelemetry/')
              ) {
                path.replaceWith(
                  t.callExpression(
                    t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                    [t.objectExpression([])]
                  )
                );
              }
            },
          },
        };
      },
    ],
  };
};
