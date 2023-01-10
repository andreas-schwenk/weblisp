/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (AND sexpr*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runAND(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let res = SExpr.atomT();
  for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr) {
    res = this.eval(s.car);
    if (res.type === T.NIL) break;
  }
  return res;
}
