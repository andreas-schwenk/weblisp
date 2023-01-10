/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (DO init cond body*)
 *   init = ((id start update)*)
 *   cond = (condCore expr*)
 * @param this
 * @param sexpr
 * @returns
 */
export function runDO(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let res = SExpr.atomNIL();
  const doScope: { [id: string]: SExpr } = {};
  this.variables.push(doScope);
  const init = SExpr.nth(sexpr, 1);
  const cond = SExpr.nth(sexpr, 2);
  const body = SExpr.nthcdr(sexpr, 3);
  if (this.check && (init.type !== T.CONS || cond.type !== T.CONS))
    throw new RunError("DO is not well structured");
  // init
  for (let t = init; t.type !== T.NIL; t = t.cdr) {
    const id = SExpr.nth(t.car, 0);
    if (this.check && id.type !== T.ID) throw new RunError("expected ID");
    const expr = this.eval(SExpr.nth(t.car, 1));
    doScope[id.data as string] = expr;
  }
  // do ...
  for (;;) {
    // condition
    let doBreak = false;
    for (let idx = 0, t = cond; t.type !== T.NIL; idx++, t = t.cdr) {
      const u = this.eval(t.car);
      if (idx == 0) {
        if (u.type === T.T) doBreak = true;
        else break;
      }
      if (idx > 0) res = u;
    }
    if (doBreak) break;
    // body
    for (let t = body; t.type !== T.NIL; t = t.cdr) {
      this.eval(t.car);
    }
    // update
    for (let t = init; t.type !== T.NIL; t = t.cdr) {
      const id = SExpr.nth(t.car, 0);
      const expr = this.eval(SExpr.nth(t.car, 2));
      doScope[id.data as string] = expr;
    }
  }
  this.variables.pop();
  return res;
}
