/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runDEFCONST_PARAM(
  this: WebLISP,
  sexpr: SExpr,
  isDefConstant: boolean
): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 2);
  const id = sexpr.cdr.car;
  const value = this.eval(sexpr.cdr.cdr.car);
  if (this.check && id.type !== T.ID) throw new RunError("expected ID");
  const s = id.data as string;
  this.variables[0][s] = value;
  if (isDefConstant) this.constants.add(s);
  return SExpr.global(s);
}
