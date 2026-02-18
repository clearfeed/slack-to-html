const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    { ignores: ['test/**'] },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-unused-vars': 'warn',
        },
    },
];
