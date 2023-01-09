/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runCAR(this: WebLISP, sexpr: SExpr): SExpr {
  if (this.interpret) {
    if (this.check) this.checkArgCount(sexpr, 1);
    const param = this.eval(sexpr.cdr.car);
    if (this.check && param.type !== T.CONS)
      throw new RunError("CAR expects a list");
    return param.car;
  } else {
    return SExpr.atomSTRING(this.eval(sexpr.cdr.car) + ".car");
  }
}
