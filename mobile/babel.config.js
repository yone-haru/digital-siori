module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // @supabase/supabase-js's OpenTelemetry instrumentation uses
      // import(/* webpackIgnore: true */ OTEL_PKG) where OTEL_PKG is a
      // string-constant identifier. Hermes cannot parse dynamic import().
      // Replace those imports with Promise.resolve({}).
      function resolveOtelDynamicImports({ types: t }) {
        return {
          visitor: {
            CallExpression(path) {
              if (path.node.callee.type !== 'Import') return;

              const arg = path.node.arguments[0];
              if (!arg) return;

              let moduleName = null;

              if (arg.type === 'StringLiteral') {
                moduleName = arg.value;
              } else if (arg.type === 'Identifier') {
                // Resolve constant bindings: const OTEL_PKG = "@opentelemetry/api"
                const binding = path.scope.getBinding(arg.name);
                if (
                  binding?.path?.isVariableDeclarator() &&
                  binding.path.get('init').isStringLiteral()
                ) {
                  moduleName = binding.path.node.init.value;
                }
              }

              if (moduleName?.startsWith('@opentelemetry/')) {
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
