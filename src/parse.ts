/* webLISP, 2022 by Andreas Schwenk */

import { Lexer } from "./lex";
import { SExpr, SExprType } from "./sexpr";

export class Parser {
  public static parse(lexer: Lexer): SExpr[] {
    const res: SExpr[] = [];
    while (!lexer.isEof()) {
      res.push(this.parseRec(lexer));
    }
    return res;
  }

  //G sexpr = "(" { sexpr } ")" | "NIL" | "." | INT | ID;
  private static parseRec(lexer: Lexer): SExpr {
    if (lexer.getToken() === "NIL") {
      return SExpr.atomNIL();
    } else if (lexer.getToken() === "(") {
      lexer.next();
      let sexpr: SExpr = null;
      let first: SExpr = SExpr.atomNIL();
      let i = 0;
      let dot = false;
      let dots = 0;
      while (!lexer.isEof() && lexer.getToken() !== ")") {
        const s = this.parseRec(lexer);
        if (s.type === SExprType.IDENTIFIER && s.data === ".") {
          if (i == 0) throw new Error("'.' is not allowed here.");
          dot = true;
          dots++;
          continue;
        }
        if (dot) {
          sexpr.cdr = s;
          dot = false;
          break;
        }
        const cons = SExpr.cons(s, SExpr.atomNIL());
        if (i == 0) first = cons;
        if (sexpr != null) sexpr.cdr = cons;
        sexpr = cons;
        i++;
      }
      if (dot || dots > 1) throw new Error("'.' is not allowed here.");
      if (lexer.getToken() === ")") lexer.next();
      else throw new Error("expected ')'");
      return first;
    } else if (lexer.getToken() === ".") {
      lexer.next();
      return SExpr.atomID(".");
    } else if (lexer.getToken()[0] >= "0" && lexer.getToken()[0] <= "9") {
      const value = parseInt(lexer.getToken());
      lexer.next();
      return SExpr.atomINT(value);
    } else {
      const value = lexer.getToken();
      lexer.next();
      return SExpr.atomID(value);
    }
  }
}
