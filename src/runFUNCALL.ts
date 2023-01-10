/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (FUNCALL function parameter*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runFUNCALL(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkMinArgCount(sexpr, 2);
  const fun = this.eval(sexpr.cdr.car);
  if (this.check && fun.type !== T.DEFUN)
    throw new RunError("expected a function");
  return this.call(fun.cdr.car, sexpr.cdr.cdr, fun.cdr.cdr);
}
