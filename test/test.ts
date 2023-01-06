/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import * as glob from "glob";
import * as fs from "fs";
import { WebLISP } from "../src/weblisp";
import { SExprType } from "../src/types";
import { SExpr } from "../src/sexpr";

let src: string;
let w: WebLISP;

/* TODO: reactivate these tests:
//src = "(write (car '(271 1337)))";
//src = "'(3 4 5 6 7 8)";
src = "(write (length '(3 4 5 6 7 8)))";
//src = "(cdr '(1337 314 271))";
w = new WebLISP();
w.import(src);
const code = w.compile();
//console.log(code);
try {
  const f = new Function("", code);
  f();
} catch (e) {
  console.log(e);
  process.exit(-1);
}
*/

//process.exit(0);

src = `(setf x 3)
(+ x x)
`;
w = new WebLISP();
w.import(src);
w.addBreakpoint(2);
try {
  const res = w.run();
} catch (e) {
  console.log(e);
}
const d = w.getDebugInfo();

const path_list = glob.sync("tests/*.lisp").sort();
for (const path of path_list) {
  console.log("===== " + path + " =====");
  const program = fs.readFileSync(path, "utf-8");
  const w = new WebLISP();
  w.import(program);
  try {
    const res = w.run();
    if (res.length < 1 || res[res.length - 1].type !== SExprType.T) {
      console.log("ERROR: test failed!");
      process.exit(-1);
    }
  } catch (e) {
    console.log("ERROR: test failed!");
    console.log(e);
    process.exit(-1);
  }
}

console.log("All tests succeeded!!");
