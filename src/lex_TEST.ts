/* webLISP, 2022 by Andreas Schwenk */

import * as assert from "assert";

import { Lexer } from "./lex";

let src = `
(* (- 21 1.2 . 31) ; comment
    41 -5 *blub* my-id x234)
`;
const lex = new Lexer(src);

while (!lex.isEof()) {
  console.log(lex.getRow() + ":" + lex.getCol() + ":" + lex.getToken());
  lex.next();
}

// TODO: assert results
