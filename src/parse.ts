/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

/**
 * This file implements an SExpr-Parser.
 *
 * Additions to COMMON LISP:
 * - "`sexpr"    is parsed to "(BACKQUOTE sexpr)"
 * - ",sexpr"    is parsed to "(COMMA sexpr)"
 * - "#'sexpr"   is parsed to "(FUNCTION sexpr)"
 * - "[sexpr*]"  is parsed to "(COMMA (sexpr*))"
 * - "(TRS ...)" uses specialized syntax to denote
 *      Term Rewriting Systems (TRS) expressively.
 */

import { Lexer } from "./lex";
import { TRS_Parser } from "./parseTRS";
import { SExpr } from "./sexpr";
import { SExprType } from "./types";

export class ParseError extends Error {
  constructor(msg: string, row = -1, col = -1) {
    if (row < 0) super("Error: " + msg);
    else super("Error:" + row + ":" + col + ": " + msg);
    this.name = "ParseError";
  }
}

export class Parser {
  /**
   * parses a sequence of s-expressions
   * @param lexer
   * @returns
   */
  public parse(lexer: Lexer): SExpr[] {
    const res: SExpr[] = [];
    while (!lexer.isEof()) res.push(this.parseSExpr(lexer));
    return res;
  }

  /**
   * recursively parses an SExpr
   * @param lexer
   * @returns
   */
  public parseSExpr(lexer: Lexer): SExpr {
    //G sexpr = "T" | "NIL" | "#'" | "'" | "`" | "," | "(" { sexpr } ")"
    //   | "[" { sexpr } "]" | "." | ["-"] (INT | FLOAT | RATIO)
    //   | "#\\X", with character X | STR | ID.
    if (lexer.getToken() === "T") {
      // "T"
      const sexpr = SExpr.atomT(lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (lexer.getToken() === "NIL") {
      // "NIL"
      const sexpr = SExpr.atomNIL(lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (["#'", "'", "`", ","].includes(lexer.getToken())) {
      // "#'" | "'" | "`" | ","
      let id = "";
      switch (lexer.getToken()) {
        case "#'":
          // #'S -> (function S)
          id = "FUNCTION";
          break;
        case "'":
          // 'S -> (quote S)
          id = "QUOTE";
          break;
        case "`":
          // `S -> (backquote S)
          id = "BACKQUOTE";
          break;
        case ",":
          // ,S -> (comma S)
          id = "COMMA";
          break;
      }
      lexer.next();
      return this.generateUnaryCall(id, this.parseSExpr(lexer));
    } else if (lexer.getToken() === "(" || lexer.getToken() === "[") {
      // "(" { sexpr } ")" | "[" { sexpr } "]"
      const brackets = lexer.getToken() === "[";
      lexer.next();
      let parsingTRS = false;
      if (lexer.getToken() === "TRS") {
        // in case of "(TRS ...)", the parser translates
        // the call to "(REWRITE ...)" using class TRS_Parser
        parsingTRS = true;
        lexer.activateTrsMode(true);
      }
      let sexpr: SExpr = null;
      let first: SExpr = SExpr.atomNIL(lexer.getRow(), lexer.getCol());
      let i = 0;
      let dot = false;
      let dotCtr = 0;
      while (
        !lexer.isEof() &&
        lexer.getToken() !== ")" &&
        lexer.getToken() !== "]"
      ) {
        const s = this.parseSExpr(lexer);
        if (s.type === SExprType.ID && s.data === ".") {
          if (i == 0)
            throw new ParseError(
              "'.' is not allowed here.",
              s.srcRow,
              s.srcCol
            );
          dot = true;
          dotCtr++;
          continue;
        }
        if (dot) {
          sexpr.cdr = s;
          dot = false;
          break;
        }
        const cons = SExpr.cons(s, SExpr.atomNIL(), s.srcRow, s.srcCol);
        if (i == 0) first = cons;
        if (sexpr != null) sexpr.cdr = cons;
        sexpr = cons;
        i++;
      }
      if (dot || dotCtr > 1)
        throw new ParseError(
          "'.' is not allowed here.",
          lexer.getRow(),
          lexer.getCol()
        );
      if (
        (!brackets && lexer.getToken() === ")") ||
        (brackets && lexer.getToken() === "]")
      )
        lexer.next();
      else
        throw new ParseError(
          "expected '" + (brackets ? "]" : ")") + "'",
          lexer.getRow(),
          lexer.getCol()
        );
      if (parsingTRS) {
        lexer.activateTrsMode(false);
        const trsParser = new TRS_Parser(this);
        first = trsParser.TRS_postprocess(first);
      }
      return brackets ? this.generateUnaryCall("COMMA", first) : first;
    } else if (lexer.getToken() === ".") {
      // "."
      const sexpr = SExpr.atomID(".", lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (
      // ["-"] (INT | FLOAT | RATIO)
      (lexer.getToken()[0] >= "0" && lexer.getToken()[0] <= "9") ||
      (lexer.getToken().length > 1 &&
        lexer.getToken()[0] == "-" &&
        lexer.getToken()[1] != ">")
    ) {
      const tk = lexer.getToken();
      let sexpr: SExpr;
      if (tk.includes("."))
        sexpr = SExpr.atomFLOAT(parseFloat(tk), lexer.getRow(), lexer.getCol());
      else if (tk.includes("/"))
        sexpr = SExpr.atomRATIO(
          parseInt(tk.split("/")[0]),
          parseInt(tk.split("/")[1]),
          lexer.getRow(),
          lexer.getCol()
        );
      else sexpr = SExpr.atomINT(parseInt(tk), lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (lexer.getToken().startsWith("#\\")) {
      // "#\\X", with character X
      // TODO: check, if valid
      const tk = lexer.getToken();
      const sexpr = SExpr.atomCHAR(tk.substring(2));
      lexer.next();
      return sexpr;
    } else if (lexer.getToken()[0] == '"') {
      // STR
      const tk = lexer.getToken();
      const sexpr = SExpr.atomSTRING(tk.substring(1, tk.length - 1));
      lexer.next();
      return sexpr;
    } else {
      // ID
      let value = lexer.getToken();
      const sexpr = SExpr.atomID(value, lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    }
  }

  /**
   * creates an SExpr of the form "(ID sexpr)"
   * @param id
   * @param sexpr
   * @returns
   */
  public generateUnaryCall(id: string, sexpr: SExpr): SExpr {
    return SExpr.cons(
      SExpr.atomID(id),
      SExpr.cons(sexpr, SExpr.atomNIL(), sexpr.srcRow, sexpr.srcCol),
      sexpr.srcRow,
      sexpr.srcCol
    );
  }

  /**
   * creates an SExpr of the form "(ID args[0] args[1] ...)"
   * @param id
   * @param args
   * @returns
   */
  public generateCall(id: string, args: SExpr[]): SExpr {
    let e: SExpr = SExpr.atomNIL();
    for (let k = args.length - 1; k >= 0; k--) e = SExpr.cons(args[k], e);
    return SExpr.cons(SExpr.atomID(id), e);
  }
}
