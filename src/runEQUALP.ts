/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (EQUALP sexpr sexpr)
 * @param this
 * @param sexpr
 * @returns
 */
export function runEQUALP(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 2);
  return SExpr.equalp(this.eval(sexpr.cdr.car), this.eval(sexpr.cdr.cdr.car))
    ? SExpr.atomT()
    : SExpr.atomNIL();
}
