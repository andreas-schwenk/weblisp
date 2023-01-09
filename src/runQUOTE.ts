/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runQUOTE(this: WebLISP, sexpr: SExpr): SExpr {
  if (this.interpret) {
    if (this.check) this.checkArgCount(sexpr, 1);
    return sexpr.cdr.car;
  } else {
    return SExpr.atomSTRING(sexpr.cdr.car.toCode());
  }
}
