/* webLISP, 2022 by Andreas Schwenk */

export enum SExprType {
  CONS = "CONS", // car, cdr
  NIL = "NIL", // atom
  INT = "INT", // atom
  ID = "ID", // atom
  STR = "STR", // atom
}

export class SExpr {
  type: SExprType;
  data: number | string;
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

  static atomNIL(srcRow = -1, srcCol = -1): SExpr {
    return new SExpr(SExprType.NIL, srcRow, srcCol);
  }

  static atomINT(value: number, srcRow = -1, srcCol = -1): SExpr {
    const s = new SExpr(SExprType.INT, srcRow, srcCol);
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

  /**
   * Converts an s-expr to a string.
   * @returns
   */
  toString(): string {
    switch (this.type) {
      case SExprType.NIL:
        return "NIL";
      case SExprType.INT:
        return "" + (this.data as number);
      case SExprType.ID:
      case SExprType.STR:
        return this.data as string;
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
