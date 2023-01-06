/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import * as assert from "assert";

import { Lexer } from "./lex";

let src = `
' #'#'f()
(* (- 21 1.2 . 31 "hello, world!" #\\x) ; comment
    41 -5 *blub* my-id x234)
`;
const lex = new Lexer(src);

while (!lex.isEof()) {
  console.log(lex.getRow() + ":" + lex.getCol() + ":" + lex.getToken());
  lex.next();
}

// TODO: assert results
