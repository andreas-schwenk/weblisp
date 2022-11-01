/* webLISP, 2022 by Andreas Schwenk */

import * as assert from "assert";

import { Lexer } from "./lex";

let src = `
(* (+ 21 31) ; comment
    41)
`;
const lex = new Lexer(src);

while (!lex.isEof()) {
  console.log(
    lex.getTokenRow() + ":" + lex.getTokenCol() + ":" + lex.getToken()
  );
  lex.next();
}

// TODO: assert results
