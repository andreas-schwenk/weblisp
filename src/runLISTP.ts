/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (LISTP sexpr)
 * @param this
 * @param sexpr
 * @returns
 */
export function runLISTP(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 1);
  let param = this.eval(sexpr.cdr.car);
  return param.type === T.CONS || param.type === T.NIL
    ? SExpr.atomT()
    : SExpr.atomNIL();
}
