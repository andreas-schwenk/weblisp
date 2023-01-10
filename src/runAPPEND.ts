/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

/**
 * (APPEND list* obj)
 * @param this
 * @param sexpr
 * @returns
 */
export function runAPPEND(this: WebLISP, sexpr: SExpr): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  // TODO: obj must be used as CDR w/o copying all CONSES
  // TODO: must check, if list* contains lists!!
  let res = SExpr.atomNIL();
  let last = res;
  for (let t = sexpr.cdr; t.type !== T.NIL; t = t.cdr) {
    const list = this.eval(t.car);
    for (let u = list; u.type !== T.NIL; u = u.cdr) {
      const n = SExpr.cons(u.car, SExpr.atomNIL());
      if (res.type === T.NIL) {
        res = last = n;
      } else {
        last.cdr = n;
        last = last.cdr;
      }
    }
  }
  return res;
}

export function runAPPEND_TILDE(this: WebLISP, sexpr: SExpr): SExpr {
  if (this.check) this.checkArgCount(sexpr, 1);
  return this.runAPPEND_TILDE_core(this.eval(sexpr.cdr.car));
}

export function runAPPEND_TILDE_core(this: WebLISP, s: SExpr): SExpr {
  if (s.type !== T.CONS) return s;
  let res = s;
  let change;
  do {
    change = false;
    let t = res;
    let last: SExpr = null;
    while (t.type != T.NIL) {
      if (t.car.type === T.ID && (t.car.data as string) === "~") {
        change = true;
        if (t.cdr.car.type !== T.CONS && t.cdr.car.type !== T.NIL)
          throw new RunError("append~ can only append lists");
        const subList = SExpr.copyList(t.cdr.car);
        t = t.cdr.cdr;
        if (subList.type === T.NIL) {
          if (last == null) res = t;
          else last.cdr = t;
        } else {
          if (last == null) res = subList;
          else last.cdr = subList;
          const newLast = SExpr.getLastCdr(subList);
          if (newLast != null) last = newLast;
          last.cdr = t;
        }
      } else {
        last = t;
        t = t.cdr;
      }
    }
  } while (change);
  // run recursively
  for (let t = res; t.type !== T.NIL; t = t.cdr)
    if (t.car.type === T.CONS) t.car = this.runAPPEND_TILDE_core(t.car);
  return res;
}
