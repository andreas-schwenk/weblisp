/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (BACKQUOTE sexpr)
 * @param this
 * @param sexpr
 * @returns
 */
export function runBACKQUOTE(this: WebLISP, sexpr: SExpr): SExpr {
  // TODO: move code!
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 1);
  return this.runBACKQUOTE_core(sexpr.cdr.car);
}

export function runBACKQUOTE_core(this: WebLISP, s: SExpr): SExpr {
  if (s.type === T.CONS) {
    if (s.car.type === T.ID && (s.car.data as string) === "COMMA")
      return this.eval(s.cdr.car);
    s.car = this.runBACKQUOTE_core(s.car);
    s.cdr = this.runBACKQUOTE_core(s.cdr);
  }
  return s;
}
