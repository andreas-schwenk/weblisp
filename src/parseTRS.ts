/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { ParseError, Parser } from "./parse";
import { SExpr } from "./sexpr";
import { SExprType } from "./types";

export class TRS_Parser {
  private parser: Parser = null;

  constructor(parser: Parser) {
    this.parser = parser;
  }

  //G (TRS input {s "->" t})
  TRS_postprocess(s: SExpr): SExpr {
    // TODO: move TRS functions to new file parseTRS.ts
    // TODO: check if variables exist, ...
    const res = SExpr.cons(SExpr.atomID("REWRITE"), SExpr.atomNIL());
    let r = res;
    if (SExpr.len(s) < 2)
      throw new ParseError("TRS has too few args", s.srcRow, s.srcCol);
    let state = "input";
    let cond: string[] = [];
    let variables: Set<string>;
    for (let t = s.cdr; t.type !== SExprType.NIL; t = t.cdr) {
      let arg = t.car;
      switch (state) {
        case "input": {
          this.TRS_uppercase(arg, false, null);
          r.cdr = SExpr.cons(arg, SExpr.atomNIL());
          r = r.cdr;
          state = "s";
          break;
        }
        case "s": {
          variables = new Set<string>();
          cond = this.TRS_extractTypeConditions(arg);
          this.TRS_uppercase(arg, true, variables);
          arg = this.parser.embedIntoId("BACKQUOTE", arg);
          r.cdr = SExpr.cons(arg, SExpr.atomNIL());
          r = r.cdr;
          state = "->";
          break;
        }
        case "->": {
          if (arg.type !== SExprType.ID || (arg.data as string) !== "->")
            throw new ParseError("expected '->' while parsing TRS");
          // generate conditions
          const generatedConditions: SExpr[] = [];
          for (const c of cond) {
            const varId = c.split(":")[0];
            const varType = c.split(":")[1];
            switch (varType) {
              case "number":
                // (NUMBERP VAR)
                generatedConditions.push(
                  SExpr.cons(
                    SExpr.atomID("NUMBERP"),
                    SExpr.cons(
                      SExpr.atomID(varId), //
                      SExpr.atomNIL()
                    )
                  )
                );
                break;
              default:
                throw new ParseError("condition has unknown type " + varType);
            }
          }
          if (cond.length == 0) {
            r.cdr = SExpr.cons(SExpr.atomT(), SExpr.atomNIL());
            r = r.cdr;
          } else if (cond.length == 1) {
            r.cdr = SExpr.cons(generatedConditions[0], SExpr.atomNIL());
            r = r.cdr;
          } else {
            // (AND c1 c2 ...)
            const and = SExpr.cons(
              this.parser.generateCall("AND", generatedConditions),
              SExpr.atomNIL()
            );
            r.cdr = and;
            r = r.cdr;
          }
          state = "t";
          break;
        }
        case "t": {
          //cond = this.TRS_extractTypeConditions(arg);
          this.TRS_uppercase(arg, false, null);
          arg = this.TRS_commaVariablesAndCommands(arg, variables);
          arg = this.parser.embedIntoId("BACKQUOTE", arg);
          r.cdr = SExpr.cons(arg, SExpr.atomNIL());
          r = r.cdr;
          state = "s";
          break;
        }
      }
    }
    //console.log(res.toString(true)); // TODO: only print on "verbose"
    return res;
  }

  TRS_extractTypeConditions(s: SExpr): string[] {
    let res: string[] = [];
    switch (s.type) {
      case SExprType.ID: {
        const value = s.data as string;
        if (value.includes(":")) {
          res.push(value);
          s.data = value.split(":")[0];
        }
        break;
      }
      case SExprType.CONS:
        res = res.concat(this.TRS_extractTypeConditions(s.car));
        res = res.concat(this.TRS_extractTypeConditions(s.cdr));
        break;
    }
    return res;
  }

  TRS_uppercase(
    s: SExpr,
    insertVariables: boolean,
    gatheredVariables: Set<string>
  ): void {
    switch (s.type) {
      case SExprType.ID: {
        const value = s.data as string;
        if (
          insertVariables &&
          value.length > 0 &&
          value[0] >= "A" &&
          value[0] <= "Z" &&
          value === value.toUpperCase() &&
          value !== "QUOTE" &&
          value !== "BACKQUOTE" &&
          value !== "COMMA"
        ) {
          let varId = value.toUpperCase();
          let sequence = false;
          if (varId.endsWith("*")) {
            sequence = true;
            varId = varId.substring(0, varId.length - 1);
          }
          gatheredVariables.add(varId);
          s.data = (sequence ? "$$" : "$") + varId;
        } else {
          s.data = value.toUpperCase();
        }
        break;
      }
      case SExprType.CONS:
        this.TRS_uppercase(s.car, insertVariables, gatheredVariables);
        this.TRS_uppercase(s.cdr, insertVariables, gatheredVariables);
        break;
    }
  }

  TRS_commaVariablesAndCommands(
    s: SExpr,
    variables: Set<string>,
    isComma = false
  ): SExpr {
    switch (s.type) {
      case SExprType.ID: {
        let id = s.data as string;
        let sequence = false;
        /*if (id.startsWith("~")) {
          sequence = true;
          id = s.data = id.substring(1);
        }*/
        if (!isComma && variables.has(id)) {
          s = this.parser.embedIntoId("COMMA", s);
          //if (sequence) s = this.parser.embedIntoId("~", s);
        }
        break;
      }
      case SExprType.CONS: {
        if (s.car.type === SExprType.ID && (s.car.data as string) === "COMMA")
          isComma = true;
        s.car = this.TRS_commaVariablesAndCommands(s.car, variables, isComma);
        s.cdr = this.TRS_commaVariablesAndCommands(s.cdr, variables, isComma);
        break;
      }
    }
    return s;
  }
}
