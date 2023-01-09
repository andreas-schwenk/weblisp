/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runTYPEP(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 2);
  const expr = this.eval(sexpr.cdr.car);
  const id = this.eval(sexpr.cdr.cdr.car);
  if (this.check && id.type !== T.ID)
    throw new RunError("expected ID as second param");
  const s = id.data as string;
  if (this.check && ["INTEGER", "FLOAT", "RATIO"].includes(s) == false)
    throw new RunError("unexpected TYPE " + s);
  if (
    (expr.type === T.INT && s === "INTEGER") ||
    (expr.type === T.FLOAT && s === "FLOAT") ||
    (expr.type === T.RATIO && s === "RATIO")
  )
    return SExpr.atomT();
  else SExpr.atomNIL();
}
