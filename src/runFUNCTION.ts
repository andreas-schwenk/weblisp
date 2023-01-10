/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (FUNCTION id)
 * @param this
 * @param sexpr
 * @returns
 */
export function runFUNCTION(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 1);
  const idExpr = sexpr.cdr.car;
  if (this.check && idExpr.type !== T.ID) throw new RunError("expected ID");
  const id = idExpr.data as string;
  if (this.check && id in this.functions == false)
    throw new RunError("undefined function " + (id as string));
  return SExpr.defun(id, this.functions[id as string]);
}
