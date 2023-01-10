/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (IF cond codeT codeF)
 * @param this
 * @param sexpr
 * @returns
 */
export function runIF(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  this.checkMinArgCount(sexpr, 2);
  if (this.eval(SExpr.nth(sexpr, 1)).type !== T.NIL)
    return this.eval(SExpr.nth(sexpr, 2));
  else return this.eval(SExpr.nth(sexpr, 3));
}
