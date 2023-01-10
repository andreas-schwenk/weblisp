/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (REMOVE needle haystack-list)
 * @param this
 * @param sexpr
 * @returns
 */
export function runREMOVE(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 2);
  const needle = sexpr.cdr.car;
  const haystack = this.eval(sexpr.cdr.cdr.car);
  return haystack.remove(needle);
}
