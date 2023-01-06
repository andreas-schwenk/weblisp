/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

// TODO: add comments to this file

import { Lexer } from "./lex";
import { TRS_Parser } from "./parseTRS";
import { SExpr } from "./sexpr";
import { SExprType } from "./types";

export class Parser {
  public parse(lexer: Lexer): SExpr[] {
    const res: SExpr[] = [];
    while (!lexer.isEof()) {
      res.push(this.parseSExpr(lexer));
    }
    return res;
  }

  //G sexpr = "#'" sexpr | "'" sexpr | "`" sexpr | "(" { sexpr } ")" | "T" | "NIL" | "." | INT | REAL | CHAR | STR | ID;
  public parseSExpr(lexer: Lexer): SExpr {
    if (lexer.getToken() === "T") {
      const sexpr = SExpr.atomT(lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (lexer.getToken() === "NIL") {
      const sexpr = SExpr.atomNIL(lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (["#'", "'", "`", ","].includes(lexer.getToken())) {
      // #'S -> (function S)
      // 'S -> (quote S)
      // `S -> (backquote S)
      // ,S -> (comma S)
      // TODO: "backquote" and "comma" are not Common LISP compatible!
      let id = "";
      switch (lexer.getToken()) {
        case "#'":
          id = "FUNCTION";
          break;
        case "'":
          id = "QUOTE";
          break;
        case "`":
          id = "BACKQUOTE";
          break;
        case ",":
          id = "COMMA";
          break;
      }
      lexer.next();
      const s = this.parseSExpr(lexer);
      let sexpr = SExpr.cons(
        SExpr.atomID(id),
        SExpr.cons(s, SExpr.atomNIL()),
        lexer.getRow(),
        lexer.getCol()
      );
      return sexpr;
    } else if (lexer.getToken() === "(" || lexer.getToken() === "[") {
      // TODO: only allow brackets in TRS mode!
      const brackets = lexer.getToken() === "[";
      lexer.next();
      let parsingTRS = false;
      if (lexer.getToken() === "TRS") {
        parsingTRS = true;
        lexer.activateTrsMode(true);
      }
      let sexpr: SExpr = null;
      let first: SExpr = SExpr.atomNIL(lexer.getRow(), lexer.getCol());
      let i = 0;
      let dot = false;
      let dots = 0;
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
      return brackets ? this.embedIntoId("COMMA", first) : first;
    } else if (lexer.getToken() === ".") {
      const sexpr = SExpr.atomID(".", lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    } else if (
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
      // TODO: check, if valid
      const tk = lexer.getToken();
      const sexpr = SExpr.atomCHAR(tk.substring(2));
      lexer.next();
      return sexpr;
    } else if (lexer.getToken()[0] == '"') {
      const tk = lexer.getToken();
      const sexpr = SExpr.atomSTRING(tk.substring(1, tk.length - 1));
      lexer.next();
      return sexpr;
    } else {
      let value = lexer.getToken();
      const sexpr = SExpr.atomID(value, lexer.getRow(), lexer.getCol());
      lexer.next();
      return sexpr;
    }
  }

  public embedIntoId(id: string, sexpr: SExpr): SExpr {
    return SExpr.cons(
      SExpr.atomID(id),
      SExpr.cons(sexpr, SExpr.atomNIL()),
      sexpr.srcRow,
      sexpr.srcCol
    );
  }

  public generateCall(id: string, args: SExpr[]): SExpr {
    let e: SExpr = SExpr.atomNIL();
    for (let k = args.length - 1; k >= 0; k--) e = SExpr.cons(args[k], e);
    return SExpr.cons(SExpr.atomID(id), e);
  }
}

export class ParseError extends Error {
  constructor(msg: string, row = -1, col = -1) {
    if (row < 0) super("Error: " + msg);
    else super("Error:" + row + ":" + col + ": " + msg);
    this.name = "ParseError";
  }
}
