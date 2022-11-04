/* webLISP, 2022 by Andreas Schwenk

LISP tutorials:
- https://lisp-lang.org/learn/getting-started/
- https://gigamonkeys.com/book/
- https://jtra.cz/stuff/lisp/sclr/index.html

*/

import { Lexer } from "./lex";
import { Parser } from "./parse";
import { SExpr, SExprType } from "./sexpr";

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
    let res: number;
    let s, t: SExpr;
    let op = "";
    let i = 0;

    switch (sexpr.type) {
      case SExprType.NIL:
      case SExprType.INT:
        return sexpr;

      case SExprType.CONS:
        switch (sexpr.car.type) {
          case SExprType.ID:
            op = sexpr.car.data as string;
            switch (op) {
              case "+":
              case "-":
              case "*":
                res = op === "*" ? 1 : 0;
                (s = sexpr.cdr), (i = 0);
                while (s.type == SExprType.CONS) {
                  t = this.eval(s.car);
                  switch (t.type) {
                    case SExprType.INT:
                      if (op === "*") res *= t.data as number;
                      else res += t.data as number;
                      break;
                    default:
                      throw new RunError(t.toString() + " is not a number");
                  }
                  if (i == 0 && op === "-") res = -res;
                  s = s.cdr;
                  i++;
                }
                return SExpr.atomINT(res);
              case "QUOTE":
              case "WRITE":
              case "CAR":
              case "CDR":
              case "LENGTH":
                if (
                  sexpr.cdr.type === SExprType.NIL ||
                  sexpr.cdr.cdr.type !== SExprType.NIL
                ) {
                  throw new RunError("expected one argument");
                }
                switch (op) {
                  case "QUOTE":
                    return sexpr.cdr.car;
                  case "WRITE":
                    t = this.eval(sexpr.cdr.car);
                    console.log(t.toString());
                    return t;
                  case "CAR":
                  case "CDR":
                  case "LENGTH":
                    s = this.eval(sexpr.cdr.car);
                    if (s.type !== SExprType.CONS)
                      throw new RunError("CAR expects a list");
                    switch (op) {
                      case "CAR":
                        return s.car;
                      case "CDR":
                        return s.cdr;
                      case "LENGTH":
                        i = 0;
                        while (s.type == SExprType.CONS) {
                          i++;
                          s = s.cdr;
                        }
                        return SExpr.atomINT(i);
                    }
                }

              default:
                throw new RunError("unimplemented!!"); // TODO: some cases are errors
            }
            break;
          default:
            throw new RunError("unimplemented!!"); // TODO: some cases are errors
        }
        break;

      default:
        throw new RunError("unimplemented!!");
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
w.import("(write (length (quote (3 4 5 6 7 8))))");

try {
  w.run();
} catch (e) {
  console.log(e);
}
