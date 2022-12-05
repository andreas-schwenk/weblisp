/* webLISP, 2022 by Andreas Schwenk

LISP tutorials:
- https://lisp-lang.org/learn/getting-started/
- https://gigamonkeys.com/book/
- https://jtra.cz/stuff/lisp/sclr/index.html

*/

import { Lexer } from "./lex";
import { Parser } from "./parse";
import { SExpr } from "./sexpr";
import { Ratio, SExprType as T } from "./types";

export class WebLISP {
  private output = "";
  private program: SExpr[] = [];

  private startTime = 0;
  private maxSeconds = Infinity;

  public import(input: string): void {
    const lexer = new Lexer(input);
    this.program = Parser.parse(lexer);
  }

  public getOutput(): string {
    return this.output;
  }

  public run(maxSeconds = Infinity): void {
    this.output = "";
    this.startTime = Date.now();
    this.maxSeconds = maxSeconds;
    for (const sexpr of this.program) {
      this.eval(sexpr);
    }
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
    let u, v: number;
    let s, t, car, cdr, res: SExpr;
    let op = "";
    let i = 0;
    let b = true;

    switch (sexpr.type) {
      case T.NIL:
      case T.INT:
        return sexpr;

      case T.CONS:
        switch (sexpr.car.type) {
          case T.ID:
            op = sexpr.car.data as string;
            switch (op) {
              // -- one argument --
              case "QUOTE":
              case "WRITE":
              case "CAR":
              case "CDR":
              case "LENGTH":
              case "SIN":
              case "COS":
              case "TAN":
                if (sexpr.cdr.type === T.NIL || sexpr.cdr.cdr.type !== T.NIL) {
                  throw new RunError("expected one argument");
                }
                switch (op) {
                  case "QUOTE":
                    return sexpr.cdr.car;
                  case "WRITE":
                    s = this.eval(sexpr.cdr.car);
                    console.log(s.toString());
                    return s;
                  case "CAR":
                  case "CDR":
                  case "LENGTH":
                    s = this.eval(sexpr.cdr.car);
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
                    s = this.eval(sexpr.cdr.car);
                    if (s.type === T.INT || s.type === T.FLOAT)
                      v = s.data as number;
                    else if (s.type === T.RATIO)
                      v = (s.data as Ratio).toFloat();
                    else new RunError(op + " expects a number");
                    switch (op) {
                      case "SIN":
                        return SExpr.atomFLOAT(Math.sin(v));
                      case "COS":
                        return SExpr.atomFLOAT(Math.cos(v));
                      case "TAN":
                        return SExpr.atomFLOAT(Math.tan(v));
                    }
                }
              // -- two arguments --
              case "CONS":
                if (
                  sexpr.cdr.type === T.NIL ||
                  sexpr.cdr.cdr.type === T.NIL ||
                  sexpr.cdr.cdr.cdr.type !== T.NIL
                ) {
                  throw new RunError("expected two arguments");
                }
                car = this.eval(sexpr.cdr.car);
                cdr = this.eval(sexpr.cdr.cdr.car);
                return SExpr.cons(car, cdr);
              // -- n arguments (n >= 0) --
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
                        : (t.data as number);
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
                u = op === ">" || op === ">=" ? Infinity : -Infinity;
                (s = sexpr.cdr), (i = 0);
                while (s.type == T.CONS) {
                  t = this.eval(s.car);
                  switch (t.type) {
                    case T.INT:
                      v = t.data as number;
                      if (
                        (op === ">" && v >= u) ||
                        (op === ">=" && v > u) ||
                        (op === "<" && v <= u) ||
                        (op === "<=" && v < u)
                      ) {
                        b = false;
                        break;
                      } else u = v;
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
                throw new RunError("unimplemented / error!!"); // TODO
            }
            break;
          default:
            throw new RunError("unimplemented / error!!"); // TODO
        }
        break;

      default:
        throw new RunError("unimplemented / error!!"); // TODO
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

// TODO: move the following to a new test file
const w = new WebLISP();
//w.import("(write (+ 3 4 (* 5 6) 7 8 (- 20 10 5) (car (quote (47 11)) ) ) )");
//w.import("(write (length (quote (3 4 5 6 7 8))))");
//w.import("(write (cons 3 4))");
//w.import("(write (<= 3 3 5 3 3 3))");
//w.import("(write (sin 1))");
//w.import("(write (/ 4 6 2 3 4))");

// TODO: (/ (/ 3.0))

try {
  w.run();
} catch (e) {
  console.log(e);
}
