/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (DEFUN function-id parameter-list sexpr*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runDEFUN(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  // (DEFUN id (id*) expr*)
  if (this.check) {
    this.checkMinArgCount(sexpr, 2);
    if (
      SExpr.nth(sexpr, 1).type !== T.ID ||
      !(
        SExpr.nth(sexpr, 2).type === T.CONS ||
        SExpr.nth(sexpr, 2).type === T.NIL
      )
    ) {
      throw new RunError("DEFUN is not well structured");
    }
  }
  const id = SExpr.nth(sexpr, 1).data as string;
  const params_body = SExpr.nthcdr(sexpr, 2);
  this.functions[id] = params_body;
  return SExpr.defun(id, params_body);
}
