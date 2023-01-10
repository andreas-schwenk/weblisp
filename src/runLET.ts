/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (LET ((id init)*) expr*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runLET(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  // TODO: LET vs LET*
  let res = SExpr.atomNIL();
  const letScope: { [id: string]: SExpr } = {};
  this.variables.push(letScope);
  const id_init = SExpr.nth(sexpr, 1);
  const expr = SExpr.nthcdr(sexpr, 2);
  for (let s = id_init; s.type !== T.NIL; s = s.cdr) {
    if (this.check && SExpr.len(s.car) != 2)
      throw new RunError("expected (id init)");
    const id = SExpr.nth(s.car, 0);
    if (this.check && id.type !== T.ID) throw new RunError("expected ID");
    const init = this.eval(SExpr.nth(s.car, 1));
    letScope[id.data as string] = init;
  }
  for (let s = expr; s.type !== T.NIL; s = s.cdr) res = this.eval(s.car);
  this.variables.pop();
  return res;
}
