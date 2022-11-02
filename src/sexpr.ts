/* webLISP, 2022 by Andreas Schwenk */

export enum SExprType {
  CONS = "CONS", // car, cdr
  NIL = "NIL", // atom
  INTEGER = "INTEGER", // atom
  IDENTIFIER = "IDENTIFIER", // atom
  String = "STRING", // atom
}

export class SExpr {
  type: SExprType;
  data: number | string;
  car: SExpr = null; // only valid, if type == SExprType.Cons
  cdr: SExpr = null; // only valid, if type == SExprType.Cons

  static cons(car: SExpr, cdr: SExpr): SExpr {
    const s = new SExpr();
    s.type = SExprType.CONS;
    s.car = car;
    s.cdr = cdr;
    return s;
  }

  static atomNIL(): SExpr {
    const s = new SExpr();
    s.type = SExprType.NIL;
    return s;
  }

  static atomINT(value: number): SExpr {
    const s = new SExpr();
    s.type = SExprType.INTEGER;
    s.data = value;
    return s;
  }

  static atomID(id: string): SExpr {
    const s = new SExpr();
    s.type = SExprType.IDENTIFIER;
    s.data = id;
    return s;
  }

  static atomSTRING(str: string): SExpr {
    const s = new SExpr();
    s.type = SExprType.String;
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
      case SExprType.INTEGER:
        return "" + (this.data as number);
      case SExprType.IDENTIFIER:
      case SExprType.String:
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
