const esbuild = require("esbuild");
const { exec } = require("child_process");

esbuild.buildSync({
  platform: "browser",
  globalName: "weblisp",
  minify: true,
  target: "es2020",
  entryPoints: ["src/weblisp.js"],
  bundle: true,
  outfile: "build/weblisp.min.js",
});

exec("cp build/weblisp.min.js docs/");
exec("cd docs && ./update.sh");
