/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runDOLIST(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  // (DOLIST (id list) expr*)
  let res = SExpr.atomNIL();
  const scope: { [id: string]: SExpr } = {};
  this.variables.push(scope);
  const id = SExpr.deepNth(sexpr, [1, 0]);
  if (this.check && id.type !== T.ID) throw new RunError("expected ID");
  let list = this.eval(SExpr.deepNth(sexpr, [1, 1]));
  let expr = SExpr.nthcdr(sexpr, 2);
  while (list.type !== T.NIL) {
    scope[id.data as string] = list.car;
    for (let e = expr; e.type !== T.NIL; e = e.cdr) this.eval(e.car);
    list = list.cdr;
  }
  this.variables.pop();
  return res;
}
