/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function runREWRITE(this: WebLISP, sexpr: SExpr): SExpr {
  // TODO: move code!
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  if (this.check) this.checkMinArgCount(sexpr, 4);
  // TODO: check, if number of arguments minus 1 divides 3 w/o rest
  // TODO: stop infinite loops
  // term to be rewritten
  const u = this.eval(SExpr.nth(sexpr, 1));
  let v = u;
  const s: SExpr[] = []; // evaluated left-hand sides of rules
  const cond: SExpr[] = []; // unevaluated conditions of rules
  const t: SExpr[] = []; // unevaluated right-hand sides of rules
  // read rules
  let x = SExpr.nthcdr(sexpr, 2);
  while (x.type !== T.NIL) {
    s.push(this.eval(x.car));
    x = x.cdr;
    cond.push(x.car);
    x = x.cdr;
    t.push(x.car);
    x = x.cdr;
  }
  // rewrite
  const n = s.length; // number of rules
  return this.runREWRITE_core(n, s, cond, t, v);
}

export function runREWRITE_core(
  this: WebLISP,
  n: number,
  s: SExpr[],
  cond: SExpr[],
  t: SExpr[],
  v: SExpr
): SExpr {
  // rewrite
  let change;
  let numChanges = 0;
  do {
    change = false;
    // run recursively
    if (v.type === T.CONS) {
      v.car = this.runREWRITE_core(n, s, cond, t, v.car);
      v.cdr = this.runREWRITE_core(n, s, cond, t, v.cdr);
    }
    // for all rules  s[cond]->t : find matching rule for v
    for (let i = 0; i < n; i++) {
      const scope: { [id: string]: SExpr } = {};
      this.variables.push(scope);
      const matching = SExpr.match(s[i], v, scope);
      if (matching && this.eval(cond[i]).type !== T.NIL) {
        // TODO: only log in verbose mode
        const vOldStr = v.toString();
        v = this.eval(SExpr.clone(t[i]));
        // TODO: appendTilde ONLY if "~" is present (add APPEND~ by parser if needed!)
        v = this.runAPPEND_TILDE_core(v);
        console.log(
          "REWROTE " +
            vOldStr +
            " -> " +
            v.toString() +
            " (USING RULE " +
            s[i].toString() +
            " -> " +
            t[i].toString() +
            ")"
        );
        change = true;
        numChanges++;
      }
      this.variables.pop();
    }
  } while (change);
  return v;
}
