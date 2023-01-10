/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

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

  set(v: SExpr) {
    this.type = v.type;
    this.data = v.data;
    this.car = v.car;
    this.cdr = v.cdr;
    this.srcRow = v.srcRow;
    this.srcCol = v.srcCol;
  }

  static cons(car: SExpr, cdr: SExpr, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.CONS, srcRow, srcCol);
    s.car = car;
    s.cdr = cdr;
    s.data = null;
    return s;
  }

  static defun(id: string, fun: SExpr, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.DEFUN, srcRow, srcCol);
    s.car = SExpr.atomID(id);
    s.cdr = fun;
    return s;
  }

  static global(id: string, srcRow = -1, srcCol = -1): SExpr {
    const g = new SExpr(SExprType.GLOBAL, srcRow, srcCol);
    g.data = id;
    return g;
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

  static atomCHAR(char: string, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.CHAR, srcRow, srcCol);
    s.data = char;
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

  static nthcdr(s: SExpr, idx: number): SExpr {
    let i = 0;
    while (s.type !== SExprType.NIL) {
      if (i == idx) return s;
      s = s.cdr;
      i++;
    }
    return SExpr.atomNIL();
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

  static deepNth(s: SExpr, idxList: number[]): SExpr {
    let res: SExpr = SExpr.atomNIL();
    for (let i = 0; i < idxList.length && s.type !== SExprType.NIL; i++)
      res = s = SExpr.nth(s, idxList[i]);
    return res;
  }

  static equalp(u: SExpr, v: SExpr): boolean {
    // TODO: allow e.g. u==INT and v==FLOAT
    if (u.type !== v.type) return false;
    switch (u.type) {
      case SExprType.T:
      case SExprType.NIL:
        return true;
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
      case SExprType.CHAR:
      case SExprType.STR:
        if ((u.data as string) !== (v.data as string)) return false;
        break;
      default:
        throw new Error("unimplemented SExpr.equalp(..) type " + u.type);
    }
    return true;
  }

  static match(
    pattern: SExpr,
    s: SExpr,
    vars: { [id: string]: SExpr }
  ): boolean {
    if (pattern.type === SExprType.ID) {
      const id = pattern.data as string;
      if (id.startsWith("$")) {
        const varId = id.substring(1);
        if (varId in vars) {
          if (SExpr.equalp(vars[varId], s) == false) {
            return false;
          }
        } else vars[varId] = s;
        return true;
      }
    }
    if (pattern.type === SExprType.CONS && pattern.car.type === SExprType.ID) {
      const id = pattern.car.data as string;
      if (id.startsWith("$$")) {
        const varId = id.substring(2);
        if (varId in vars) {
          if (SExpr.equalp(vars[varId], s) == false) {
            return false;
          }
        }
        vars[varId] = s;
        return true;
      }
    }
    if (pattern.type !== s.type) return false;
    if (pattern.type === SExprType.CONS) {
      return (
        SExpr.match(pattern.car, s.car, vars) &&
        SExpr.match(pattern.cdr, s.cdr, vars)
      );
    }
    return pattern.data === s.data;
  }

  remove(key: SExpr): SExpr {
    let res, t: SExpr;
    res = SExpr.atomNIL();
    let s = <SExpr>this;
    let i = 0;
    while (s.type !== SExprType.NIL) {
      let element = s.car;
      if (
        element.type !== SExprType.CONS &&
        element.type === key.type &&
        element.data === key.data
      ) {
        /* skip */
      } else {
        if (i == 0) {
          res = t = SExpr.cons(element, SExpr.atomNIL());
        } else {
          t.cdr = SExpr.cons(element, SExpr.atomNIL());
          t = t.cdr;
        }
      }
      s = s.cdr;
      i++;
    }
    return res;
  }

  static subst(newExpr: SExpr, oldExpr: SExpr, tree: SExpr): SExpr {
    if (oldExpr.type === SExprType.CONS) return tree;
    if (oldExpr.type === tree.type && oldExpr.data === tree.data)
      return newExpr;
    if (tree.type === SExprType.CONS) {
      const s = SExpr.cons(
        SExpr.subst(newExpr, oldExpr, tree.car),
        SExpr.subst(newExpr, oldExpr, tree.cdr)
      );
      return s;
    }
    return tree;
  }

  static clone(s: SExpr): SExpr {
    if (s.type === SExprType.CONS)
      return SExpr.cons(
        SExpr.clone(s.car),
        SExpr.clone(s.cdr),
        s.srcRow,
        s.srcCol
      );
    else {
      const c = new SExpr(s.type, s.srcRow, s.srcCol);
      if (s.type === SExprType.RATIO) c.data = (s.data as Ratio).clone();
      else c.data = s.data;
      return c;
    }
  }

  static copyList(s: SExpr): SExpr {
    let res: SExpr = SExpr.atomNIL();
    let current: SExpr = null;
    let last: SExpr = null;
    for (let t = s; t.type != SExprType.NIL; t = t.cdr) {
      current = SExpr.cons(t.car, SExpr.atomNIL());
      if (last == null) res = current;
      else last.cdr = current;
      last = current;
    }
    return res;
  }

  static getLastCdr(s: SExpr): SExpr {
    let res = s;
    while (s.type !== SExprType.NIL) {
      res = s;
      s = s.cdr;
    }
    return res;
  }

  toFloat(): number {
    switch (this.type) {
      case SExprType.INT:
      case SExprType.FLOAT:
        return this.data as number;
      case SExprType.RATIO:
        return (this.data as Ratio).toFloat();
      default:
        return 0;
    }
  }

  toCode(): string {
    switch (this.type) {
      case SExprType.T:
        return "SExpr.atomT()";
      case SExprType.NIL:
        return "SExpr.atomNIL()";
      case SExprType.INT:
      case SExprType.FLOAT:
        return "SExpr.atomINT(" + (this.data as number) + ")";
      case SExprType.RATIO:
        return (
          "SExpr.atomRATIO(" +
          (this.data as Ratio).numerator +
          "," +
          (this.data as Ratio).denominator +
          ")"
        );
      case SExprType.CONS:
        return (
          "SExpr.cons(" + this.car.toCode() + "," + this.cdr.toCode() + ")"
        );
      default:
        throw Error("unimplemented SExpr.toCode() for type " + this.type);
    }
  }

  /**
   * Converts an s-expr to a string.
   * @returns
   */
  toString(format = false, indent = 0): string {
    // TODO: if format==true, then prevent empty line at beginning (only an issue for CONS)
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
      case SExprType.GLOBAL:
        return this.data as string;
      case SExprType.CHAR:
        return "#\\" + (this.data as string);
      case SExprType.STR:
        return '"' + (this.data as string) + '"';
      case SExprType.DEFUN:
        return "FUNCTION " + (this.car.data as string);
      case SExprType.CONS:
        let s = "";
        if (format) {
          s += "\n";
          for (let i = 0; i < indent * 2; i++) s += " ";
          indent++;
        }
        s += "(";
        let node = this as SExpr;
        let i = 0;
        do {
          if (node.type === SExprType.NIL) break;
          if (i > 0) s += " ";
          if (node.type != SExprType.CONS) {
            s += "." + " " + node.toString(format, indent);
            break;
          }
          s += node.car.toString(format, indent);
          node = node.cdr;
          i++;
        } while (node != null);
        s += ")";
        indent--;
        return s;
      default:
        throw new Error("unimplemented");
    }
  }
}
