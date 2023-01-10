/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (LENGTH sexpr)
 * @param this
 * @param sexpr
 * @returns
 */
export function runLENGTH(this: WebLISP, sexpr: SExpr): SExpr {
  if (this.interpret) {
    if (this.check) this.checkArgCount(sexpr, 1);
    let param = this.eval(sexpr.cdr.car);
    if (this.check) {
      if (param.type !== T.CONS && param.type !== T.NIL)
        throw new RunError("LENGTH expects a list");
    }
    let len;
    for (len = 0; param.type === T.CONS; len++) param = param.cdr;
    return SExpr.atomINT(len);
  } else {
    const list = this.genVar();
    const ctr = this.genVar();
    const param = this.eval(sexpr.cdr.car);
    const c =
      `let ${list}=${param};\n` +
      `let ${ctr};\n` +
      `for(${ctr}=0; ${list}.type === SExprType.CONS; ${ctr}++)\n` +
      `  ${list} = ${list}.cdr;\n`;
    this.code += c;
    return SExpr.atomSTRING(`SExpr.atomINT(${ctr})`);
  }
}
