/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runOR(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let res = SExpr.atomNIL();
  for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr) {
    const t = this.eval(s.car);
    if (t.type !== T.NIL) return t;
    res = t;
  }
  return res;
}
