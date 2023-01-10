/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (MEMBER needle haystack)
 * @param this
 * @param sexpr
 * @returns
 */
export function runMEMBER(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 2);
  const needle = this.eval(SExpr.nth(sexpr, 1));
  const haystack = this.eval(SExpr.nth(sexpr, 2));
  let res = SExpr.atomNIL();
  // TODO: "equalp" is not used per default in common lisp
  for (let h = haystack; h.type !== T.NIL; h = h.cdr)
    if (SExpr.equalp(needle, h.car)) res = h;
  return res;
}
