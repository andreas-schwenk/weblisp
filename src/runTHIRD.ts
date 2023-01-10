/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (THIRD sexpr)
 * @param this
 * @param sexpr
 * @returns
 */
export function runTHIRD(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 1);
  let param = this.eval(sexpr.cdr.car);
  return SExpr.nth(param, 2);
}
