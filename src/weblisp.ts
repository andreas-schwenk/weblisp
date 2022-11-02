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
    let sum: number;
    let s, t: SExpr;
    switch (sexpr.type) {
      case SExprType.NIL:
      case SExprType.INT:
        return sexpr;

      case SExprType.CONS:
        switch (sexpr.car.type) {
          case SExprType.ID:
            switch (sexpr.car.data) {
              case "+":
                sum = 0;
                s = sexpr.cdr;
                while (s.type == SExprType.CONS) {
                  t = this.eval(s.car);
                  sum += t.data as number; // TODO: check type
                  s = s.cdr;
                }
                return SExpr.atomINT(sum);

              case "WRITE":
                // TODO: check, if cdr.car is valid; check that there are no more args, ...
                t = this.eval(sexpr.cdr.car);
                console.log(t.data as string);
                return t;
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
w.import("(write (+ 3 4 (+ 5 6)))");

try {
  w.run();
} catch (e) {
  console.log(e);
}
