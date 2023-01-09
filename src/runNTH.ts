/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runNTH(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  // (NTH idx list)
  if (this.check) this.checkArgCount(sexpr, 2);
  const idx = sexpr.cdr.car;
  const list = this.eval(sexpr.cdr.cdr.car);
  if (this.check && idx.type !== T.INT)
    throw new RunError("expected an integer index");
  const i = idx.data as number;
  if (this.check && i < 0)
    throw new RunError("expected a non-negative integer index");
  return SExpr.nth(list, i);
}
