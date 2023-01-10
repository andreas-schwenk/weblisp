/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (LAMBDA parameter-list sexpr*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runLAMBDA(this: WebLISP, sexpr: SExpr): SExpr {
  // TODO: error check
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  return SExpr.defun("LAMBDA", SExpr.nthcdr(sexpr, 1));
}
