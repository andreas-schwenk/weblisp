export enum SExprType {
  Cons = "CONS", // car, cdr
  Int = "INT", // atom
  Identifier = "ID", // atom
  String = "STRING", // atom
}

export class SExpr {
  type: SExprType;
  data: number | string;
  car: SExpr | null = null; // only valid, if type == SExprType.Cons
  cdr: SExpr | null = null; // only valid, if type == SExprType.Cons

  static cons(car: SExpr | null, cdr: SExpr | null): SExpr {
    const s = new SExpr();
    s.type = SExprType.Cons;
    s.car = car;
    s.cdr = cdr;
    return s;
  }

  static atomINT(value: number): SExpr {
    const s = new SExpr();
    s.type = SExprType.Int;
    s.data = value;
    return s;
  }

  static atomID(id: string): SExpr {
    const s = new SExpr();
    s.type = SExprType.String;
    s.data = id;
    return s;
  }

  static atomSTRING(str: string): SExpr {
    const s = new SExpr();
    s.type = SExprType.Identifier;
    s.data = str;
    return s;
  }

  /**
   * returns a list of s-expressions, e.g. "(+ 3 4) 5" returns two s-expressions.
   * @param input
   * @returns
   */
  static fromString(input: string): SExpr[] {
    // (a) tokenize
    const tokens = [];
    const n = input.length;
    let row = 1,
      col = 1; // TODO
    let tk = "";
    const ws = " \t\n"; // white spaces
    const del = "()+-*/><="; // delimiters
    // TODO: multi-char delimiters: ">=", ...
    const ws_del = ws + del;
    for (let i = 0; i < n; i++) {
      let ch = input[i];
      if (ch == ";") {
        i++;
        // comment
        while (i < n && ch != "\n") ch = input[i++];
      }
      if (ws_del.includes(ch)) {
        if (tk.length > 0) {
          tokens.push(tk);
          tk = "";
        }
        if (!ws.includes(ch)) tokens.push(ch);
      } else tk += ch;
    }
    if (tk.length > 0) tokens.push(tk);
    // (b) parse
    // TODO: tokenize + parse simultaneously
    let sexprList: SExpr[] = [];
    let stack: SExpr[] = [];
    let s: SExpr = null;
    let nextIsCdr = false;
    let depth = 0;
    for (const token of tokens) {
      if (token === ".") {
        nextIsCdr = true;
      } else if (token === "(") {
        depth++;
        if (s == null) {
          if (nextIsCdr) throw Error("'.' not allowed here");
          s = SExpr.cons(null, null);
          stack.push(s);
        } else if (nextIsCdr) {
          nextIsCdr = false;
          if (s.cdr != null) throw Error("'.' not allowed here");
          stack.push(s);
          s.cdr = SExpr.cons(null, null);
          s = s.cdr;
        } else {
          if (s.car != null) {
            if (s.cdr != null) throw Error("'.' not allowed here");
            s.cdr = SExpr.cons(null, null);
            s = s.cdr;
          }
          stack.push(s);
          s.car = SExpr.cons(null, null);
          s = s.car;
        }
      } else if (token === ")") {
        depth--;
        if (stack.length == 0) throw Error("')' is not allowed");
        s = stack.pop();
      } else {
        let u: SExpr = null;
        if (token[0] >= "0" && token[0] <= "9") {
          const value = parseFloat(token);
          u = SExpr.atomINT(value); // TODO: INT vs FLOAT
        } else {
          u = SExpr.atomID(token);
        }
        if (s == null) {
          if (nextIsCdr) throw Error("'.' not allowed here");
          s = u;
        } else if (nextIsCdr) {
          nextIsCdr = false;
          if (s.cdr != null) throw Error("'.' not allowed here");
          s.cdr = u;
        } else {
          if (s.car != null) {
            if (s.cdr != null) throw Error("'.' not allowed here");
            s.cdr = SExpr.cons(null, null);
            s = s.cdr;
          }
          s.car = u;
        }
      }
      if (depth == 0) {
        sexprList.push(s);
        s = null;
      }
    }
    if (depth != 0) throw Error("not well formed");
    return sexprList; // TODO
  }

  toString(parentheses = true): string {
    switch (this.type) {
      case SExprType.Int:
        return "" + (this.data as number);
      case SExprType.Identifier:
        return this.data as string;
      case SExprType.String:
        return this.data as string;
      case SExprType.Cons:
        let s = "";
        if (this.car == null) s = "NIL";
        else if (this.car.type === SExprType.Cons) s = this.car.toString(true);
        else s = this.car.toString(false);
        if (this.cdr == null) s += "";
        else if (this.cdr.type == SExprType.Cons)
          s += " " + this.cdr.toString(false);
        else s += " . " + this.cdr.toString(true);
        if (parentheses) return "(" + s + ")";
        else return s;
      default:
        throw Error("unimplemented");
    }
  }
}
