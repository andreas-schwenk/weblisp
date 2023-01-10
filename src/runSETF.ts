/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (SETF place expr place expr ...)
 * @param this
 * @param sexpr
 * @returns
 */
export function runSETF(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  const n = SExpr.len(sexpr);
  if (this.check) this.checkEvenArgCount(sexpr);
  let res = SExpr.atomNIL();
  for (let s = sexpr.cdr; s.type !== T.NIL; s = s.cdr.cdr) {
    res = this.eval(s.car, true); // true := create if not exists
    res.set(this.eval(s.cdr.car));
  }
  return res;
}
