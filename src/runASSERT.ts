/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

// TODO: implementation is a subset of Common-LISP

/**
 * (ASSERT test error-message)
 * @param this
 * @param sexpr
 * @returns
 */
export function runASSERT(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkMinArgCount(sexpr, 1);
  const test = this.eval(sexpr.cdr.car);
  let message = "";
  if (sexpr.cdr.cdr.type !== T.NIL) {
    if (this.check && sexpr.cdr.cdr.car.type !== T.STR)
      throw new RunError("expected STR for error message");
    message = sexpr.cdr.cdr.car.data as string;
  }
  if (test.type === T.NIL)
    throw new RunError(
      "ASSERT FAILED: " + (message.length > 0 ? message : "(no message)")
    );
  return SExpr.atomNIL();
}
