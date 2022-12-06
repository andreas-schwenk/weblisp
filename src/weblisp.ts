/* webLISP, 2022 by Andreas Schwenk

LISP tutorials:
- https://lisp-lang.org/learn/getting-started/
- https://gigamonkeys.com/book/
- https://jtra.cz/stuff/lisp/sclr/index.html

*/

import { Lexer } from "./lex";
import { Parser } from "./parse";
import { SExpr } from "./sexpr";
import { Ratio, SExprType, SExprType as T } from "./types";

export class WebLISP {
  private output = "";
  private program: SExpr[] = [];

  private functions: { [id: string]: SExpr } = {};
  private variables: { [id: string]: SExpr }[] = [{}];

  private startTime = 0;
  private maxSeconds = Infinity;

  public import(input: string): void {
    const lexer = new Lexer(input);
    this.program = Parser.parse(lexer);
  }

  public getOutput(): string {
    return this.output;
  }

  public run(maxSeconds = Infinity): SExpr[] {
    this.output = "";
    this.functions = {};
    this.variables = [{}];
    this.startTime = Date.now();
    this.maxSeconds = maxSeconds;
    const res: SExpr[] = [];
    for (const sexpr of this.program) {
      res.push(this.eval(sexpr));
    }
    return res;
  }

  private eval(sexpr: SExpr): SExpr {
    // check, if max time is reached
    if (
      this.maxSeconds != Infinity &&
      (Date.now() - this.startTime) / 1000 > this.maxSeconds
    ) {
      throw new RunError("max allowed runtime exceeded!");
    }
    // evaluate
    let x, y, n: number;
    let s, t, u, v, res: SExpr;
    let op = "";
    let i = 0;
    let b = true;
    let id: string;

    switch (sexpr.type) {
      case T.NIL:
      case T.T:
      case T.INT:
      case T.RATIO:
      case T.FLOAT:
        return sexpr;

      case T.ID:
        id = sexpr.data as string;
        n = this.variables.length;
        for (let i = n - 1; i >= 0; i--)
          if (id in this.variables[i]) return this.variables[i][id];
        throw new RunError("unknown symbol " + id);

      case T.CONS:
        switch (sexpr.car.type) {
          case T.ID:
            op = sexpr.car.data as string;
            switch (op) {
              // -- if --
              case "IF":
                // TODO: check for too many params
                if (sexpr.cdr.type === T.NIL || sexpr.cdr.cdr.type === T.NIL)
                  throw new RunError(
                    "expected at least two arguments for " + op
                  );
                const cond = this.eval(sexpr.cdr.car);
                const codeT = sexpr.cdr.cdr.car;
                const codeF =
                  sexpr.cdr.cdr.cdr.type === T.NIL
                    ? null
                    : sexpr.cdr.cdr.cdr.car;
                if (cond.type !== SExprType.NIL) return this.eval(codeT);
                else if (codeF != null) return this.eval(codeF);
                break;
              // -- defun --
              case "DEFUN":
                if (
                  sexpr.cdr.type === T.NIL ||
                  sexpr.cdr.car.type !== SExprType.ID
                )
                  throw new RunError("expected function ID");
                if (
                  sexpr.cdr.cdr.type === T.NIL ||
                  sexpr.cdr.cdr.car.type !== SExprType.CONS
                )
                  throw new RunError("expected parameter list after ID");
                const id = sexpr.cdr.car.data as string;
                this.functions[id] = sexpr.cdr.cdr;
                return SExpr.defun(id, sexpr.cdr.cdr);
              // -- one argument --
              case "QUOTE":
              case "WRITE":
              case "CAR":
              case "CDR":
              case "LENGTH":
              case "SIN":
              case "COS":
              case "TAN":
              case "THIRD":
              case "LISTP":
              case "NULL":
              case "NOT":
                if (sexpr.cdr.type === T.NIL || sexpr.cdr.cdr.type !== T.NIL)
                  throw new RunError("expected one argument for " + op);
                if (op === "QUOTE") return sexpr.cdr.car;
                s = this.eval(sexpr.cdr.car);
                switch (op) {
                  case "WRITE":
                    console.log(s.toString());
                    return s;
                  case "CAR":
                  case "CDR":
                  case "LENGTH":
                    if (s.type !== T.CONS)
                      throw new RunError("CAR expects a list");
                    switch (op) {
                      case "CAR":
                        return s.car;
                      case "CDR":
                        return s.cdr;
                      case "LENGTH":
                        i = 0;
                        while (s.type == T.CONS) {
                          i++;
                          s = s.cdr;
                        }
                        return SExpr.atomINT(i);
                    }
                  case "SIN":
                  case "COS":
                  case "TAN":
                    if (s.type === T.INT || s.type === T.FLOAT)
                      y = s.data as number;
                    else if (s.type === T.RATIO)
                      y = (s.data as Ratio).toFloat();
                    else new RunError(op + " expects a number");
                    switch (op) {
                      case "SIN":
                        return SExpr.atomFLOAT(Math.sin(y));
                      case "COS":
                        return SExpr.atomFLOAT(Math.cos(y));
                      case "TAN":
                        return SExpr.atomFLOAT(Math.tan(y));
                    }
                  case "THIRD":
                    return SExpr.nth(s, 2);
                  case "LISTP":
                    return s.type === SExprType.CONS || s.type === SExprType.NIL
                      ? SExpr.atomT()
                      : SExpr.atomNIL();
                  case "NULL":
                  case "NOT":
                    return s.type === SExprType.NIL
                      ? SExpr.atomT()
                      : SExpr.atomNIL();
                }
                break;
              // -- two arguments --
              case "CONS":
              case "EQUALP":
                if (
                  sexpr.cdr.type === T.NIL ||
                  sexpr.cdr.cdr.type === T.NIL ||
                  sexpr.cdr.cdr.cdr.type !== T.NIL
                ) {
                  throw new RunError("expected two arguments for " + op);
                }
                s = this.eval(sexpr.cdr.car);
                t = this.eval(sexpr.cdr.cdr.car);
                switch (op) {
                  case "CONS":
                    return SExpr.cons(s, t);
                  case "EQUALP":
                    return SExpr.equalp(s, t) ? SExpr.atomT() : SExpr.atomNIL();
                }
                break;
              // -- n arguments (n >= 0) --
              case "LIST":
                res = u = SExpr.atomNIL();
                (s = sexpr.cdr), (i = 0);
                while (s.type === T.CONS) {
                  t = this.eval(s.car);
                  v = SExpr.cons(t, SExpr.atomNIL());
                  if (i == 0) {
                    res = u = v;
                  } else {
                    u.cdr = v;
                    u = u.cdr;
                  }
                  s = s.cdr;
                  i++;
                }
                return res;
              case "AND":
                res = SExpr.atomT();
                s = sexpr.cdr;
                while (s.type === T.CONS) {
                  t = this.eval(s.car);
                  if (t.type === SExprType.NIL) return t;
                  res = t;
                  s = s.cdr;
                }
                return res;
              case "OR":
                res = SExpr.atomNIL();
                s = sexpr.cdr;
                while (s.type === T.CONS) {
                  t = this.eval(s.car);
                  if (t.type !== SExprType.NIL) return t;
                  res = t;
                  s = s.cdr;
                }
                return res;
              case "+":
              case "*":
                res = SExpr.atomINT(op === "+" ? 0 : 1);
                (s = sexpr.cdr), (i = 0);
                while (s.type === T.CONS) {
                  t = this.eval(s.car);
                  if (res.type === T.INT && t.type === T.INT) {
                    if (op === "+") (res.data as number) += t.data as number;
                    else (res.data as number) *= t.data as number;
                  } else if (res.type === T.INT && t.type === T.RATIO) {
                    let u: Ratio;
                    u = Ratio.fromNumber(res.data as number);
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
                      t.type === T.RATIO
                        ? (t.data as Ratio).toFloat()
                        : (t.data as number);
                    res.data = op === "+" ? u + v : u * v;
                    res.type = T.FLOAT;
                  } else
                    throw new RunError(
                      "incompatible types " +
                        res.type +
                        " and " +
                        t.type +
                        " for op " +
                        op
                    );
                  s = s.cdr;
                  i++;
                }
                if (
                  res.type === T.RATIO &&
                  (res.data as Ratio).denominator == 1
                ) {
                  res.data = (res.data as Ratio).numerator;
                  res.type = T.INT;
                }
                return res;
              case "-":
              case "/":
                res = SExpr.atomINT(op === "-" ? 0 : 1);
                (s = sexpr.cdr), (i = 0);
                while (s.type === T.CONS) {
                  t = this.eval(s.car);
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
                      t.type === T.RATIO
                        ? (t.data as Ratio).toFloat()
                        : (t.data as number);
                    res.data = op === "-" ? u - v : u / v;
                    res.type = T.FLOAT;
                  } else
                    throw new RunError(
                      "incompatible types " +
                        res.type +
                        " and " +
                        t.type +
                        " for op " +
                        op
                    );
                  s = s.cdr;
                  i++;
                }
                if (
                  res.type === T.RATIO &&
                  (res.data as Ratio).denominator == 1
                ) {
                  res.data = (res.data as Ratio).numerator;
                  res.type = T.INT;
                }
                return res;
              // -- n arguments (n >= 1) --
              case ">":
              case ">=":
              case "<":
              case "<=":
                b = true;
                x = op === ">" || op === ">=" ? Infinity : -Infinity;
                (s = sexpr.cdr), (i = 0);
                while (s.type == T.CONS) {
                  t = this.eval(s.car);
                  switch (t.type) {
                    case T.INT:
                      y = t.data as number;
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
                  s = s.cdr;
                  i++;
                }
                if (i == 0) throw new RunError("too few args");
                return b ? SExpr.atomT() : SExpr.atomNIL();

              default:
                // -- call user function --
                const fun = this.functions[op];
                if (fun == undefined)
                  throw new RunError("unknown function " + op);
                const params = fun.car;
                const body = fun.cdr;
                // open scope
                const scope: { [id: string]: SExpr } = {};
                this.variables.push(scope);
                // create parameter variables
                s = params;
                t = sexpr.cdr;
                while (s.type !== SExprType.NIL) {
                  if (t.type === SExprType.NIL)
                    throw new RunError("too few arguments");
                  const paramId = s.car;
                  if (paramId.type !== SExprType.ID)
                    throw new RunError("parameter must be an ID");
                  scope[paramId.data as string] = this.eval(t.car);
                  s = s.cdr;
                  t = t.cdr;
                }
                if (t.type !== SExprType.NIL)
                  throw new RunError("too many arguments");
                // run body code
                res = SExpr.atomNIL();
                s = body;
                while (s.type !== SExprType.NIL) {
                  res = this.eval(s.car);
                  s = s.cdr;
                }
                // close scope
                this.variables.pop();
                return res;
            }
            break;
          default:
            throw new RunError("unimplemented / error!!"); // TODO
        }
        break;

      default:
        throw new RunError("unimplemented sexpr type " + sexpr.type);
    }
    return null;
  }
}

export class RunError extends Error {
  constructor(msg: string) {
    super("Error: " + msg);
    this.name = "RunError";
  }
}
