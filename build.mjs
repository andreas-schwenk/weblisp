import * as esbuild from "esbuild";
import fs from "fs";
import { exec } from "child_process";

esbuild.buildSync({
  platform: "browser",
  globalName: "weblisp",
  minify: true,
  target: "es2020",
  entryPoints: ["src/weblisp.ts"],
  bundle: true,
  outfile: "build/weblisp.min.js",
});

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
runtimeCode = "export const runtimeCode = `" + runtimeCode + "`;";
fs.writeFileSync("src/runtimeCode.ts", runtimeCode);
//console.log(runtimeCode);

exec("cp build/weblisp.min.js docs/");
exec("cd docs && ./update.sh");
