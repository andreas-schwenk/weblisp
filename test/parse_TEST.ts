/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import * as assert from "assert";
import { Lexer } from "../src/lex";

import { Parser } from "../src/parse";

let src = "(+ 1.5 2)";
let lex = new Lexer(src);
let parser = new Parser();
let sexpr = parser.parse(lex);
assert.ok(sexpr.toString() === src);

//src = "(COMMA 1 2 3 (COMMA 3 4))"

src = `
(* (+ 21 31) ; comment
    41)
`;
let exp = "(* (+ 21 31) 41)";
lex = new Lexer(src);
parser = new Parser();
sexpr = parser.parse(lex);
assert.ok(sexpr.length == 1);
assert.ok(sexpr[0].toString() === exp);

src = "(a b) 5"; // TODO: 5 (* 3 4)
lex = new Lexer(src);
parser = new Parser();
sexpr = parser.parse(lex);
assert.ok(sexpr.length == 2);
assert.ok(sexpr[0].toString() === "(A B)");
assert.ok(sexpr[1].toString() === "5");

// TODO: move to new file parseTRS_TEST.ts
src =
  "(trs '(1 b 3 3 4 5 66 77 88) (1 b X X Y:number Z:number W*) -> (blub X Y [+ 2 X] W ~ W)";
exp =
  "(" +
  /**/ "REWRITE " +
  /**/ "(QUOTE (1 B 3 3 4 5 66 77 88)) " +
  /**/ "(QUOTE (1 B $X $X $Y $Z $$W)) " +
  /**/ "(AND (NUMBERP Y) (NUMBERP Z)) " +
  /**/ "(BACKQUOTE (BLUB (COMMA X) (COMMA Y) (COMMA (+ 2 X)) (COMMA W) (~ (COMMA W))))" +
  ")";
lex = new Lexer(src);
parser = new Parser();
sexpr = parser.parse(lex);
console.log(sexpr.toString());
assert.ok(sexpr.length == 1);
assert.ok(sexpr[0].toString() === exp);

let src_arr = [
  "21 -> 21",
  "(1 . 2) -> (1 . 2)",
  "(1 2 . 3) -> (1 2 . 3)",
  "(1 . 2 3) -> error",
  "(1 . (2 3)) -> (1 2 3)",
  "(1 . . 2) -> error",
  "(>= a b) -> (>= A B)",
  "() -> NIL",
  "NIL -> NIL",
  "'(+ 2 3) -> (QUOTE (+ 2 3))",
  '(a b 1 2 "hello, world!") -> (A B 1 2 "hello, world!")',
  "(x y #\\c) -> (X Y #\\c)",
];

for (let src of src_arr) {
  console.log("testing " + src);
  const input = src.split("->")[0].trim();
  const expected = src.split("->")[1].trim();
  const lex = new Lexer(input);
  let str = "";
  try {
    parser = new Parser();
    const sexpr = parser.parse(lex);
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
