/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import { SExpr } from "./sexpr";
import { Ratio, SExprType as T } from "./types";
import { RunError, WebLISP } from "./weblisp";

export function run__PLUS__MUL(this: WebLISP, sexpr: SExpr, op: string): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let res = SExpr.atomINT(op === "+" ? 0 : 1);
  for (let s = sexpr.cdr, i = 0; s.type === T.CONS; s = s.cdr, i++) {
    const t = this.eval(s.car);
    if (res.type === T.INT && t.type === T.INT) {
      if (op === "+") (res.data as number) += t.data as number;
      else (res.data as number) *= t.data as number;
    } else if (res.type === T.INT && t.type === T.RATIO) {
      let u = Ratio.fromNumber(res.data as number);
      let v = t.data as Ratio;
      res.data = op === "+" ? Ratio.add(u, v) : Ratio.mul(u, v);
      res.type = T.RATIO;
    } else if (res.type === T.RATIO && t.type === T.INT) {
      let u = res.data as Ratio;
      let v = Ratio.fromNumber(t.data as number);
      res.data = op === "+" ? Ratio.add(u, v) : Ratio.mul(u, v);
      res.type = T.RATIO;
    } else if (res.type === T.RATIO && t.type === T.RATIO) {
      let u = res.data as Ratio;
      let v = t.data as Ratio;
      res.data = op === "+" ? Ratio.add(u, v) : Ratio.mul(u, v);
      res.type = T.RATIO;
    } else if (
      [T.INT, T.RATIO, T.FLOAT].includes(res.type) &&
      [T.INT, T.RATIO, T.FLOAT].includes(t.type)
    ) {
      let u =
        res.type === T.RATIO
          ? (res.data as Ratio).toFloat()
          : (res.data as number);
      let v =
        t.type === T.RATIO ? (t.data as Ratio).toFloat() : (t.data as number);
      res.data = op === "+" ? u + v : u * v;
      res.type = T.FLOAT;
    } else
      throw new RunError(
        "incompatible types " + res.type + " and " + t.type + " for op " + op
      );
  }
  if (res.type === T.RATIO && (res.data as Ratio).denominator == 1) {
    res.data = (res.data as Ratio).numerator;
    res.type = T.INT;
  }
  return res;
}

export function run__MINUS__DIV(
  this: WebLISP,
  sexpr: SExpr,
  op: string
): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let res = SExpr.atomINT(op === "-" ? 0 : 1);
  for (let s = sexpr.cdr, i = 0; s.type === T.CONS; s = s.cdr, i++) {
    const t = this.eval(s.car);
    if (i == 0 && s.cdr.type !== T.NIL) {
      res.type = t.type;
      res.data = t.data;
    } else if (res.type === T.INT && t.type === T.INT) {
      if (op === "-") (res.data as number) -= t.data as number;
      else {
        let u = res.data as number;
        let v = t.data as number;
        res.data = new Ratio(u, v);
        res.type = T.RATIO;
      }
    } else if (res.type === T.INT && t.type === T.RATIO) {
      let u: Ratio;
      u = Ratio.fromNumber(res.data as number);
      let v = t.data as Ratio;
      res.data = op === "-" ? Ratio.sub(u, v) : Ratio.div(u, v);
      res.type = T.RATIO;
    } else if (res.type === T.RATIO && t.type === T.INT) {
      let u = res.data as Ratio;
      let v = Ratio.fromNumber(t.data as number);
      res.data = op === "-" ? Ratio.sub(u, v) : Ratio.div(u, v);
      res.type = T.RATIO;
    } else if (res.type === T.RATIO && t.type === T.RATIO) {
      let u = res.data as Ratio;
      let v = t.data as Ratio;
      res.data = op === "-" ? Ratio.sub(u, v) : Ratio.div(u, v);
      res.type = T.RATIO;
    } else if (
      [T.INT, T.RATIO, T.FLOAT].includes(res.type) &&
      [T.INT, T.RATIO, T.FLOAT].includes(t.type)
    ) {
      let u =
        res.type === T.RATIO
          ? (res.data as Ratio).toFloat()
          : (t.data as number);
      let v =
        t.type === T.RATIO ? (t.data as Ratio).toFloat() : (t.data as number);
      res.data = op === "-" ? u - v : u / v;
      res.type = T.FLOAT;
    } else
      throw new RunError(
        "incompatible types " + res.type + " and " + t.type + " for op " + op
      );
  }
  if (res.type === T.RATIO && (res.data as Ratio).denominator == 1) {
    res.data = (res.data as Ratio).numerator;
    res.type = T.INT;
  }
  return res;
}

export function run__COMPARE(this: WebLISP, sexpr: SExpr, op: string): SExpr {
  if (!this.interpret) throw new RunError("UNIMPLEMENTED");
  let b = true;
  let x = op === ">" || op === ">=" ? Infinity : -Infinity;
  let i;
  for (let s = sexpr.cdr, i = 0; s.type == T.CONS; s = s.cdr, i++) {
    const t = this.eval(s.car);
    switch (t.type) {
      case T.INT:
        const y = t.data as number;
        if (
          (op === ">" && y >= x) ||
          (op === ">=" && y > x) ||
          (op === "<" && y <= x) ||
          (op === "<=" && y < x)
        ) {
          b = false;
          break;
        } else x = y;
        break;
      default:
        throw new RunError(t.toString() + " is not a number");
    }
  }
  if (i == 0) throw new RunError("too few args");
  return b ? SExpr.atomT() : SExpr.atomNIL();
}
