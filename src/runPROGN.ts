/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (PROGN sexpr*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runPROGN(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let res = SExpr.atomNIL();
  for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr) res = this.eval(s.car);
  return res;
}
