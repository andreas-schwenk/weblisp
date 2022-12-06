/* webLISP, 2022 by Andreas Schwenk */

import { Ratio, SExprType } from "./types";

export class SExpr {
  type: SExprType;
  data: number | string | Ratio;
  car: SExpr = null; // only valid, if type == SExprType.Cons
  cdr: SExpr = null; // only valid, if type == SExprType.Cons
  srcRow = -1;
  srcCol = -1;

  constructor(type: SExprType, srcRow = -1, srcCol = -1) {
    this.type = type;
    this.srcRow = srcRow;
    this.srcCol = srcCol;
  }

  static cons(car: SExpr, cdr: SExpr, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.CONS, srcRow, srcCol);
    s.car = car;
    s.cdr = cdr;
    return s;
  }

  static defun(id: string, fun: SExpr, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.DEFUN, srcRow, srcCol);
    s.car = SExpr.atomID(id);
    s.cdr = fun;
    return s;
  }

  static atomNIL(srcRow = -1, srcCol = -1): SExpr {
    return new SExpr(SExprType.NIL, srcRow, srcCol);
  }

  static atomINT(value: number, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.INT, srcRow, srcCol);
    s.data = value;
    return s;
  }

  static atomRATIO(
    nominator: number,
    denominator: number,
    srcRow = -1,
    srcCol = -1
  ): SExpr {
    const s = new SExpr(SExprType.RATIO, srcRow, srcCol);
    s.data = new Ratio(nominator, denominator);
    return s;
  }

  static atomFLOAT(value: number, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.FLOAT, srcRow, srcCol);
    s.data = value;
    return s;
  }

  static atomID(id: string, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.ID, srcRow, srcCol);
    s.data = id;
    return s;
  }

  static atomSTRING(str: string, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.STR, srcRow, srcCol);
    s.data = str;
    return s;
  }

  static atomT(srcRow = -1, srcCol = -1): SExpr {
    return new SExpr(SExprType.T, srcRow, srcCol);
  }

  static len(s: SExpr): number {
    let i = 0;
    while (s.type !== SExprType.NIL) {
      s = s.cdr;
      i++;
    }
    return i;
  }

  static nth(s: SExpr, idx: number): SExpr {
    let i = 0;
    while (s.type !== SExprType.NIL) {
      if (i == idx) return s.car;
      s = s.cdr;
      i++;
    }
    return SExpr.atomNIL();
  }

  static equalp(u: SExpr, v: SExpr): boolean {
    // TODO: allow e.g. u==INT and v==FLOAT
    if (u.type !== v.type) return false;
    switch (u.type) {
      case SExprType.CONS:
        if (SExpr.equalp(u.car, v.car) == false) return false;
        if (SExpr.equalp(u.cdr, v.cdr) == false) return false;
        break;
      case SExprType.INT:
        if ((u.data as number) !== (v.data as number)) return false;
        break;
      case SExprType.FLOAT:
        const a = u.data as number;
        const b = v.data as number;
        // TODO: precision
        if (Math.abs(a - b) > 1e-12) return false;
        break;
      case SExprType.RATIO:
        if ((u.data as Ratio).compare(v.data as Ratio) == false) return false;
        break;
      case SExprType.ID:
      case SExprType.STR:
        if ((u.data as string) !== (v.data as string)) return false;
        break;
    }
    return true;
  }

  /**
   * Converts an s-expr to a string.
   * @returns
   */
  toString(): string {
    switch (this.type) {
      case SExprType.NIL:
        return "NIL";
      case SExprType.T:
        return "T";
      case SExprType.INT:
        return "" + (this.data as number);
      case SExprType.FLOAT:
        return "" + (this.data as number);
      case SExprType.RATIO:
        return "" + (this.data as Ratio).toString();
      case SExprType.ID:
      case SExprType.STR:
        return this.data as string;
      case SExprType.DEFUN:
        return this.car.data as string;
      case SExprType.CONS:
        let s = "(";
        let node = this as SExpr;
        let i = 0;
        do {
          if (node.type === SExprType.NIL) break;
          if (i > 0) s += " ";
          if (node.type != SExprType.CONS) {
            s += "." + " " + node.toString();
            break;
          }
          //s += node.car == null ? "NIL" : node.car.toString();
          s += node.car.toString();
          node = node.cdr;
          i++;
        } while (node != null);
        s += ")";
        return s;
      default:
        throw new Error("unimplemented");
    }
  }
}
