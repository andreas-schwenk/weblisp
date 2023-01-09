/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runCHAR(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkArgCount(sexpr, 2);
  const str = this.eval(sexpr.cdr.car);
  const pos = this.eval(sexpr.cdr.cdr.car);
  if (this.check && str.type !== T.STR) throw new RunError("Expected a string");
  if (this.check && pos.type !== T.INT)
    throw new RunError("Expected an integer index");
  const s = str.data as string;
  const p = pos.data as number;
  if (this.check && (p < 0 || p >= s.length))
    throw new RunError("invalid string index");
  return SExpr.atomCHAR(s[p]);
}
