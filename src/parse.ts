/* webLISP, 2022 by Andreas Schwenk */

import { Lexer } from "./lex";
import { SExpr } from "./sexpr";
import { SExprType } from "./types";

export class Parser {
  public static parse(lexer: Lexer): SExpr[] {
    const res: SExpr[] = [];
    while (!lexer.isEof()) {
      res.push(this.parseRec(lexer));
    }
    return res;
  }

  //G sexpr = "'" sexpr | "(" { sexpr } ")" | "T" | "NIL" | "." | INT | REAL | ID;
  private static parseRec(lexer: Lexer): SExpr {
    if (lexer.getToken() === "T") {
      const sexpr = SExpr.atomT(lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (lexer.getToken() === "NIL") {
      const sexpr = SExpr.atomNIL(lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (lexer.getToken() === "'") {
      // 'S -> (quote S)
      lexer.next();
      const s = this.parseRec(lexer);
      let sexpr: SExpr = SExpr.cons(
        SExpr.atomID("QUOTE"),
        SExpr.cons(s, SExpr.atomNIL()),
        lexer.getRow(),
        lexer.getCol()
      );
      return sexpr;
    } else if (lexer.getToken() === "(") {
      lexer.next();
      let sexpr: SExpr = null;
      let first: SExpr = SExpr.atomNIL(lexer.getRow(), lexer.getCol());
      let i = 0;
      let dot = false;
      let dots = 0;
      while (!lexer.isEof() && lexer.getToken() !== ")") {
        const s = this.parseRec(lexer);
        if (s.type === SExprType.ID && s.data === ".") {
          if (i == 0)
            throw new ParseError(
              "'.' is not allowed here.",
              s.srcRow,
              s.srcCol
            );
          dot = true;
          dots++;
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
      if (dot || dots > 1)
        throw new ParseError(
          "'.' is not allowed here.",
          lexer.getRow(),
          lexer.getCol()
        );
      if (lexer.getToken() === ")") lexer.next();
      else throw new ParseError("expected ')'", lexer.getRow(), lexer.getCol());
      return first;
    } else if (lexer.getToken() === ".") {
      const sexpr = SExpr.atomID(".", lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (
      (lexer.getToken()[0] >= "0" && lexer.getToken()[0] <= "9") ||
      (lexer.getToken().length > 1 && lexer.getToken()[0] == "-")
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
    } else {
      const value = lexer.getToken();
      const sexpr = SExpr.atomID(value, lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    }
  }
}

export class ParseError extends Error {
  constructor(msg: string, row = -1, col = -1) {
    if (row < 0) super("Error: " + msg);
    else super("Error:" + row + ":" + col + ": " + msg);
    this.name = "ParseError";
  }
}
