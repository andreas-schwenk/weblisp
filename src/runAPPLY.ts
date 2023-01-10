/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (APPLY function parameterList)
 * @param this
 * @param sexpr
 * @returns
 */
export function runAPPLY(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkMinArgCount(sexpr, 2);
  const fun = this.eval(sexpr.cdr.car);
  if (this.check && fun.type !== T.DEFUN)
    throw new RunError("expected a function");
  const args = this.eval(sexpr.cdr.cdr.car);
  return this.call(fun.cdr.car, args, fun.cdr.cdr);
}
