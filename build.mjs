import * as esbuild from "esbuild";
import fs from "fs";
import { exec } from "child_process";

esbuild.buildSync({
  platform: "browser",
  globalName: "RUNTIME",
  minify: true,
  target: "es2020",
  entryPoints: ["src/runtime.ts"],
  bundle: true,
  outfile: "build/runtime.min.js",
});

let runtimeCode = fs.readFileSync("build/runtime.min.js", "utf-8");
runtimeCode =
  "// THIS FILE IS AUTO CREATED BY build.mjs\n" +
  "export const runtimeCode = `" +
  runtimeCode.replace(/`\n`/g, '"\\n"') +
  "`;\n";
fs.writeFileSync("src/runtimeCode.ts", runtimeCode);
//console.log(runtimeCode);

esbuild.buildSync({
  platform: "browser",
  globalName: "weblisp",
  minify: true,
  target: "es2020",
  entryPoints: ["src/weblisp.ts"],
  bundle: true,
  outfile: "build/weblisp.min.js",
});

exec("cp build/weblisp.min.js docs/");
exec("cd docs && ./update.sh");
