/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (SUBSTITUTE new-expr old-expr tree)
 * @param this
 * @param sexpr
 * @returns
 */
export function runSUBSTITUTE(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  // TODO: SUBSTITUTE AND SUBST ARE NOT EQUAL!!
  if (this.check) this.checkArgCount(sexpr, 3);
  const newExpr = this.eval(SExpr.nth(sexpr, 1));
  const oldExpr = this.eval(SExpr.nth(sexpr, 2));
  const tree = this.eval(SExpr.nth(sexpr, 3));
  const res = SExpr.subst(newExpr, oldExpr, tree);
  return res;
}
