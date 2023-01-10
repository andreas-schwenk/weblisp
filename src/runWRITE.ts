/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (WRITE sexpr)
 * @param this
 * @param sexpr
 * @returns
 */
export function runWRITE(this: WebLISP, sexpr: SExpr): SExpr {
  if (this.interpret) {
    if (this.check) this.checkArgCount(sexpr, 1);
    const param = this.eval(sexpr.cdr.car);
    this.output += param.toString();
    console.log(param.toString());
    return param;
  } else {
    const v = this.genVar();
    const c = `let ${v} = ${this.eval(sexpr.cdr.car)};`;
    this.code += c;
    this.code += `console.log(${v}.toString());`;
    return SExpr.atomSTRING(v);
  }
}
