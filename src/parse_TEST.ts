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
assert.ok(sexpr.toString() === exp);

src = "(a b) 5";
lex = new Lexer(src);
sexpr = Parser.parse(lex);
assert.ok(sexpr.length == 2);
assert.ok(sexpr[0].toString() === "(A B)");
assert.ok(sexpr[1].toString() === "5");

// TODO: src = "( a b . c )";

//TODO: migrate tests from sexpr_TESTS
