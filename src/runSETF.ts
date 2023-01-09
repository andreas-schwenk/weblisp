/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runSETF(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  // (SETF place expr place expr ...)
  const n = SExpr.len(sexpr);
  if (this.check) this.checkEvenArgCount(sexpr);
  let res = SExpr.atomNIL();
  for (let s = sexpr.cdr; s.type !== T.NIL; s = s.cdr) {
    const place = s.car;
    res = this.eval(place, true); // true := create if not exists
    s = s.cdr; // next is expr
    const value = this.eval(s.car);
    res.set(value);
  }
  return res;
}
