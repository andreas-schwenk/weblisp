/* webLISP, 2022 by Andreas Schwenk */

import * as assert from "assert";
import { Lexer } from "./lex";

import { Parser } from "./parse";

let src = `
(* (+ 21 31) ; comment
    41)
`;
let exp = "(* (+ 21 31) 41)";
let lex = new Lexer(src);
let sexpr = Parser.parse(lex);
assert.ok(sexpr.length == 1);
assert.ok(sexpr[0].toString() === exp);

src = "(a b) 5"; // TODO: 5 (* 3 4)
lex = new Lexer(src);
sexpr = Parser.parse(lex);
assert.ok(sexpr.length == 2);
assert.ok(sexpr[0].toString() === "(A B)");
assert.ok(sexpr[1].toString() === "5");

let src_arr = [
  "21 -> 21",
  "(1 . 2) -> (1 . 2)",
  "(1 . 2 3) -> error",
  "(1 . (2 3)) -> (1 2 3)",
  "(1 . . 2) -> error",
  "(>= a b) -> (>= A B)",
  "() -> NIL",
];

for (let src of src_arr) {
  console.log("testing " + src);
  const input = src.split("->")[0].trim();
  const expected = src.split("->")[1].trim();
  const lex = new Lexer(input);
  let str = "";
  try {
    const sexpr = Parser.parse(lex);
    assert.ok(sexpr.length == 1);
    str = sexpr[0].toString();
  } catch (e) {
    assert.ok(expected === "error");
    continue;
  }
  assert.ok(
    str === expected,
    "failed: expected '" + expected + "', but got '" + str + "'"
  );
}

// TODO: src = "( a b . c )";

//TODO: migrate tests from sexpr_TESTS
