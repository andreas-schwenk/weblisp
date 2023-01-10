/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (LIST sexpr*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runLIST(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let res, u: SExpr;
  res = u = SExpr.atomNIL();
  for (let s = sexpr.cdr, i = 0; s.type === T.CONS; s = s.cdr, i++) {
    const t = this.eval(s.car);
    const v = SExpr.cons(t, SExpr.atomNIL());
    if (i == 0) res = u = v;
    else {
      u.cdr = v;
      u = u.cdr;
    }
  }
  return res;
}
