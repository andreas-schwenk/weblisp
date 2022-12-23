/* webLISP, 2022 by Andreas Schwenk */

import * as glob from "glob";
import * as fs from "fs";
import { WebLISP } from "../src/weblisp";
import { SExprType } from "../src/types";

//let src = "(write (car '(271 1337)))";
//let src = "'(3 4 5 6 7 8)";
let src = "(length '(3 4 5 6 7 8))";
let w = new WebLISP();
w.import(src);
console.log(w.compile());
process.exit(0);

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
