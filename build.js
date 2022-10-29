const esbuild = require('esbuild');

esbuild.buildSync({
    platform: 'browser',
    globalName: 'weblisp',
    minify: true,
    target: 'es2020',
    entryPoints: ['src/weblisp.js'],
    bundle: true,
    outfile: 'build/weblisp.min.js'
});
