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

// TODO: use "NTH" and for-loops to make code better readable!
// TODO: write code as for "DOLIST"

export class WebLISP {
  private output = "";
  private program: SExpr[] = [];

  private functions: { [id: string]: SExpr } = {};
  private variables: { [id: string]: SExpr }[] = [{}];
  private constants = new Set<string>(); // TODO: setf, ...

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
    this.constants = new Set<string>();
    this.startTime = Date.now();
    this.maxSeconds = maxSeconds;
    const res: SExpr[] = [];
    for (const sexpr of this.program) {
      res.push(this.eval(sexpr));
    }
    return res;
  }

  private eval(sexpr: SExpr, createVar = false): SExpr {
    // check, if max time is reached
    if (
      this.maxSeconds != Infinity &&
      (Date.now() - this.startTime) / 1000 > this.maxSeconds
    ) {
      throw new RunError("max allowed runtime exceeded!");
    }
    // evaluate
    let op = "";

    switch (sexpr.type) {
      case T.NIL:
      case T.T:
      case T.INT:
      case T.RATIO:
      case T.FLOAT:
        return sexpr;

      case T.ID: {
        const id = sexpr.data as string;
        const n = this.variables.length;
        for (let i = n - 1; i >= 0; i--) {
          if (id in this.variables[i]) return this.variables[i][id];
        }
        if (createVar) {
          this.variables[n - 1][id] = SExpr.atomNIL();
          return this.variables[n - 1][id];
        } else {
          throw new RunError("unknown symbol " + id);
        }
      }

      case T.CONS:
        switch (sexpr.car.type) {
          case T.ID:
            op = sexpr.car.data as string;
            switch (op) {
              case "TERPRI": {
                this.output += "\n";
                return SExpr.atomNIL();
              }
              case "IF": {
                // (IF cond codeT codeF)
                if (SExpr.len(sexpr) < 3)
                  throw new RunError("expected 2+ args for " + op);
                if (this.eval(SExpr.nth(sexpr, 1)).type !== SExprType.NIL)
                  return this.eval(SExpr.nth(sexpr, 2));
                else return this.eval(SExpr.nth(sexpr, 3));
              }
              case "LET": {
                // TODO: LET vs LET*
                // (LET ((id init)*) expr*)
                let res = SExpr.atomNIL();
                const letScope: { [id: string]: SExpr } = {};
                this.variables.push(letScope);
                const id_init = SExpr.nth(sexpr, 1);
                const expr = SExpr.rest(sexpr, 2);
                for (let s = id_init; s.type !== SExprType.NIL; s = s.cdr) {
                  if (SExpr.len(s.car) != 2)
                    throw new RunError("expected (id init)");
                  const id = SExpr.nth(s.car, 0);
                  if (id.type !== T.ID) throw new RunError("expected ID");
                  const init = this.eval(SExpr.nth(s.car, 1));
                  letScope[id.data as string] = init;
                }
                for (let s = expr; s.type !== SExprType.NIL; s = s.cdr)
                  res = this.eval(s.car);
                this.variables.pop();
                return res;
              }
              // -- setf --
              case "SETF": {
                // (SETF id expr id expr ...)
                const n = SExpr.len(sexpr);
                if ((n - 1) % 2 != 0)
                  throw new RunError(
                    "SETF requires an even number of arguments"
                  );
                let res = SExpr.atomNIL();
                for (let s = sexpr.cdr; s.type !== SExprType.NIL; s = s.cdr) {
                  const place = s.car;
                  res = this.eval(place, true); // true := create if not exists
                  s = s.cdr; // next
                  const value = this.eval(s.car);
                  res.set(value);
                }
                return res;
              }
              // -- do --
              case "DO": {
                // (DO init cond body*)
                // init = ((id start update)*)
                // cond = (condCore expr*)
                let res = SExpr.atomNIL();
                const doScope: { [id: string]: SExpr } = {};
                this.variables.push(doScope);
                const init = SExpr.nth(sexpr, 1);
                const cond = SExpr.nth(sexpr, 2);
                const body = SExpr.rest(sexpr, 3);
                if (
                  init.type !== SExprType.CONS ||
                  cond.type !== SExprType.CONS
                )
                  throw new RunError("DO is not well structured");
                // init
                for (let t = init; t.type !== SExprType.NIL; t = t.cdr) {
                  const id = SExpr.nth(t.car, 0);
                  if (id.type !== T.ID) throw new RunError("expected ID");
                  const expr = this.eval(SExpr.nth(t.car, 1));
                  doScope[id.data as string] = expr;
                }
                // do ...
                for (;;) {
                  // condition
                  let doBreak = false;
                  for (
                    let idx = 0, t = cond;
                    t.type !== SExprType.NIL;
                    idx++, t = t.cdr
                  ) {
                    const u = this.eval(t.car);
                    if (idx == 0) {
                      if (u.type === SExprType.T) doBreak = true;
                      else break;
                    }
                    if (idx > 0) res = u;
                  }
                  if (doBreak) break;
                  // body
                  for (let t = body; t.type !== SExprType.NIL; t = t.cdr)
                    this.eval(t.car);
                  // update
                  for (let t = init; t.type !== SExprType.NIL; t = t.cdr) {
                    const id = SExpr.nth(t.car, 0);
                    const expr = this.eval(SExpr.nth(t.car, 2));
                    doScope[id.data as string] = expr;
                  }
                }
                this.variables.pop();
                return res;
              }
              // -- defun --
              case "DEFUN": {
                // (DEFUN id (id*) expr*)
                if (
                  SExpr.len(sexpr) < 3 ||
                  SExpr.nth(sexpr, 1).type !== SExprType.ID ||
                  SExpr.nth(sexpr, 2).type !== SExprType.CONS
                )
                  throw new RunError("DEFUN is not well structured");
                const id = SExpr.nth(sexpr, 1).data as string;
                const params_body = SExpr.rest(sexpr, 2);
                this.functions[id] = params_body;
                return SExpr.defun(id, params_body);
              }
              // -- lambda --
              case "LAMBDA": {
                const params_body = SExpr.rest(sexpr, 1);
                return SExpr.defun("LAMBDA", params_body);
              }
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
              case "CONSP":
              case "NULL":
              case "NOT":
              case "NUMBERP":
              case "FUNCTION": {
                if (SExpr.len(sexpr) != 2)
                  throw new RunError("expected one argument for " + op);
                if (op === "QUOTE") return sexpr.cdr.car;
                if (op === "FUNCTION") {
                  const idExpr = sexpr.cdr.car;
                  if (idExpr.type !== SExprType.ID)
                    throw new RunError("expected ID");
                  const id = idExpr.data as string;
                  if (id in this.functions == false)
                    throw new RunError("undefined function " + (id as string));
                  return SExpr.defun(id, this.functions[id as string]);
                }
                let param = this.eval(sexpr.cdr.car);
                switch (op) {
                  case "WRITE":
                    this.output += param.toString();
                    console.log(param.toString());
                    return param;
                  case "CAR":
                  case "CDR":
                  case "LENGTH":
                    if (param.type !== T.CONS)
                      throw new RunError(op + " expects a list");
                    switch (op) {
                      case "CAR":
                        return param.car;
                      case "CDR":
                        return param.cdr;
                      case "LENGTH":
                        let i = 0;
                        while (param.type == T.CONS) {
                          i++;
                          param = param.cdr;
                        }
                        return SExpr.atomINT(i);
                    }
                  case "SIN":
                  case "COS":
                  case "TAN":
                    let y;
                    if (param.type === T.INT || param.type === T.FLOAT)
                      y = param.data as number;
                    else if (param.type === T.RATIO)
                      y = (param.data as Ratio).toFloat();
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
                    return SExpr.nth(param, 2);
                  case "LISTP":
                    return param.type === SExprType.CONS ||
                      param.type === SExprType.NIL
                      ? SExpr.atomT()
                      : SExpr.atomNIL();
                  case "CONSP":
                    return param.type === SExprType.CONS
                      ? SExpr.atomT()
                      : SExpr.atomNIL();
                  case "NULL":
                  case "NOT":
                    return param.type === SExprType.NIL
                      ? SExpr.atomT()
                      : SExpr.atomNIL();
                  case "NUMBERP":
                    return param.type === SExprType.INT ||
                      param.type === SExprType.FLOAT ||
                      param.type === SExprType.RATIO
                      ? SExpr.atomT()
                      : SExpr.atomNIL();
                }
              }
              // -- two arguments --
              case "CONS":
              case "EQUALP":
              case "TYPEP":
              case "DEFPARAMETER":
              case "DEFCONSTANT":
              case "REMOVE":
              case "NTH": {
                if (SExpr.len(sexpr) != 3)
                  throw new RunError("expected two arguments for " + op);
                let param1 = sexpr.cdr.car;
                if (["DEFPARAMETER", "DEFCONSTANT"].includes(op) == false) {
                  param1 = this.eval(param1);
                }
                const param2 = this.eval(sexpr.cdr.cdr.car);
                switch (op) {
                  case "CONS": {
                    return SExpr.cons(param1, param2);
                  }
                  case "EQUALP": {
                    return SExpr.equalp(param1, param2)
                      ? SExpr.atomT()
                      : SExpr.atomNIL();
                  }
                  case "TYPEP": {
                    if (param2.type !== SExprType.ID)
                      throw new RunError("expected ID as second param");
                    switch (param2.data as string) {
                      case "INTEGER":
                        return param1.type === SExprType.INT
                          ? SExpr.atomT()
                          : SExpr.atomNIL();
                      case "FLOAT":
                        return param1.type === SExprType.FLOAT
                          ? SExpr.atomT()
                          : SExpr.atomNIL();
                      case "RATIO":
                        return param1.type === SExprType.RATIO
                          ? SExpr.atomT()
                          : SExpr.atomNIL();
                      default:
                        throw new RunError("unexpected TYPE " + param2.data);
                    }
                  }
                  case "DEFPARAMETER":
                  case "DEFCONSTANT": {
                    if (param1.type !== T.ID) throw new RunError("expected ID");
                    const id = param1.data as string;
                    this.variables[0][id] = param2;
                    if (op === "DEFCONSTANT") this.constants.add(id);
                    return SExpr.global(id);
                  }
                  case "REMOVE": {
                    return param2.remove(param1);
                  }
                  case "NTH": {
                    // (NTH idx list)
                    if (
                      param1.type !== SExprType.INT ||
                      (param1.data as number) < 0
                    )
                      throw new RunError(
                        "expected a non-negative integer index"
                      );
                    return SExpr.nth(param2, param1.data as number);
                  }
                }
              }
              // -- n arguments (n >= 0) --
              case "PROGN": {
                let res = SExpr.atomNIL();
                for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr)
                  res = this.eval(s.car);
                return res;
              }
              case "LIST": {
                let res, u: SExpr;
                res = u = SExpr.atomNIL();
                for (
                  let s = sexpr.cdr, i = 0;
                  s.type === T.CONS;
                  s = s.cdr, i++
                ) {
                  const t = this.eval(s.car);
                  const v = SExpr.cons(t, SExpr.atomNIL());
                  if (i == 0) res = u = v;
                  else {
                    u.cdr = v;
                    u = u.cdr;
                  }
                }
                return res;
              }
              case "AND": {
                let res = SExpr.atomT();
                for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr) {
                  const t = this.eval(s.car);
                  if (t.type === SExprType.NIL) return t;
                  res = t;
                }
                return res;
              }
              case "OR": {
                let res = SExpr.atomNIL();
                for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr) {
                  const t = this.eval(s.car);
                  if (t.type !== SExprType.NIL) return t;
                  res = t;
                }
                return res;
              }
              case "+":
              case "*": {
                let res = SExpr.atomINT(op === "+" ? 0 : 1);
                for (
                  let s = sexpr.cdr, i = 0;
                  s.type === T.CONS;
                  s = s.cdr, i++
                ) {
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
                }
                if (
                  res.type === T.RATIO &&
                  (res.data as Ratio).denominator == 1
                ) {
                  res.data = (res.data as Ratio).numerator;
                  res.type = T.INT;
                }
                return res;
              }
              case "-":
              case "/": {
                let res = SExpr.atomINT(op === "-" ? 0 : 1);
                for (
                  let s = sexpr.cdr, i = 0;
                  s.type === T.CONS;
                  s = s.cdr, i++
                ) {
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
                }
                if (
                  res.type === T.RATIO &&
                  (res.data as Ratio).denominator == 1
                ) {
                  res.data = (res.data as Ratio).numerator;
                  res.type = T.INT;
                }
                return res;
              }
              // -- n arguments (n >= 1) --
              case "DOLIST": {
                // (DOLIST (id list) expr*)
                let res = SExpr.atomNIL();
                const scope: { [id: string]: SExpr } = {};
                this.variables.push(scope);
                const id = SExpr.deepNth(sexpr, [1, 0]);
                if (id.type !== SExprType.ID) throw new RunError("expected ID");
                let list = this.eval(SExpr.deepNth(sexpr, [1, 1]));
                let expr = SExpr.rest(sexpr, 2);
                while (list.type !== SExprType.NIL) {
                  scope[id.data as string] = list.car;
                  for (let e = expr; e.type !== SExprType.NIL; e = e.cdr)
                    this.eval(e.car);
                  list = list.cdr;
                }
                this.variables.pop();
                return res;
              }
              case ">":
              case ">=":
              case "<":
              case "<=": {
                let b = true;
                let x = op === ">" || op === ">=" ? Infinity : -Infinity;
                let i;
                for (
                  let s = sexpr.cdr, i = 0;
                  s.type == T.CONS;
                  s = s.cdr, i++
                ) {
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
              case "APPLY":
              case "FUNCALL": {
                // TODO: test is sexpr.cdr.type != NIL and sexpr.cdr.cdr.type != NIL and
                // (APPLY function parameterList)
                const fun = this.eval(sexpr.cdr.car);
                if (fun.type !== SExprType.DEFUN)
                  throw new RunError("expected a function");
                // create scope
                const scope: { [id: string]: SExpr } = {};
                this.variables.push(scope);
                // create parameter variables
                let arg, param: SExpr;
                arg = sexpr.cdr.cdr;
                if (op === "APPLY") arg = this.eval(arg.car);
                for (
                  param = fun.cdr.car;
                  param.type !== SExprType.NIL;
                  arg = arg.cdr, param = param.cdr
                ) {
                  if (arg.type === SExprType.NIL)
                    throw new RunError("too few arguments");
                  const paramId = param.car;
                  if (paramId.type !== SExprType.ID)
                    throw new RunError("parameter must be an ID");
                  scope[paramId.data as string] = this.eval(arg.car);
                }
                if (arg.type !== SExprType.NIL)
                  throw new RunError("too many arguments");
                // run body code
                let res = SExpr.atomNIL();
                for (
                  let body = fun.cdr.cdr;
                  body.type !== SExprType.NIL;
                  body = body.cdr
                ) {
                  res = this.eval(body.car);
                }
                // close scope
                this.variables.pop();
                return res;
              }
              default: {
                // -- call user function --
                const fun = this.functions[op];
                if (fun == undefined)
                  throw new RunError("unknown function " + op);
                // open scope
                const scope: { [id: string]: SExpr } = {};
                this.variables.push(scope);
                // create parameter variables
                let arg, param: SExpr;
                for (
                  arg = sexpr.cdr, param = fun.car;
                  param.type !== SExprType.NIL;
                  arg = arg.cdr, param = param.cdr
                ) {
                  if (arg.type === SExprType.NIL)
                    throw new RunError("too few arguments");
                  const paramId = param.car;
                  if (paramId.type !== SExprType.ID)
                    throw new RunError("parameter must be an ID");
                  scope[paramId.data as string] = this.eval(arg.car);
                }
                if (arg.type !== SExprType.NIL)
                  throw new RunError("too many arguments");
                // run body code
                let res = SExpr.atomNIL();
                for (
                  let body = fun.cdr;
                  body.type !== SExprType.NIL;
                  body = body.cdr
                ) {
                  res = this.eval(body.car);
                }
                // close scope
                this.variables.pop();
                return res;
              }
            }
          case T.INT:
          case T.RATIO:
          case T.FLOAT:
          case T.STR:
            throw new RunError("" + sexpr.car.data + " is not a function name");

          case T.CONS: {
            // TODO: checks
            const fun = this.eval(sexpr.car);
            if (fun.type !== SExprType.DEFUN)
              throw new RunError("not a function");
            const params = fun.cdr.car;
            const args = sexpr.cdr;
            // open scope
            const scope: { [id: string]: SExpr } = {};
            this.variables.push(scope);
            // create parameter variables
            let arg, param: SExpr;
            for (
              arg = args, param = params;
              param.type !== SExprType.NIL;
              arg = arg.cdr, param = param.cdr
            ) {
              if (arg.type === SExprType.NIL)
                throw new RunError("too few arguments");
              const paramId = param.car;
              if (paramId.type !== SExprType.ID)
                throw new RunError("parameter must be an ID");
              scope[paramId.data as string] = this.eval(arg.car);
            }
            if (arg.type !== SExprType.NIL)
              throw new RunError("too many arguments");
            // run body code
            let res = SExpr.atomNIL();
            for (
              let body = fun.cdr.cdr;
              body.type !== SExprType.NIL;
              body = body.cdr
            ) {
              res = this.eval(body.car);
            }
            // close scope
            this.variables.pop();
            return res;
          }

          default:
            throw new RunError("not allowed");
        }

      default:
        throw new RunError("unimplemented sexpr type " + sexpr.type);
    }
  }
}

export class RunError extends Error {
  constructor(msg: string) {
    super("Error: " + msg);
    this.name = "RunError";
  }
}
