/* webLISP, 2022 by Andreas Schwenk */

const fs = require("fs");

const wl = require("../src/weblisp");

// read input file
let input = fs.readFileSync("fib.lisp", "utf-8");

const w = new wl.WebLISP();

w.import(input);
console.log(w.sexpr_toString(w.sexpr) + "\n");

try {
  w.run();
} catch (e) {
  console.log(e);
}
