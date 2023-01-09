/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

/*
LISP tutorials:
- https://lisp-lang.org/learn/getting-started/
- https://gigamonkeys.com/book/
- https://jtra.cz/stuff/lisp/sclr/index.html
*/

import { Lexer } from "./lex";
import { Parser } from "./parse";
import { SExpr } from "./sexpr";
import { Ratio, SExprType, SExprType as T } from "./types";
import { runtimeCode } from "./runtimeCode";

export class DebugInfo {
  breakpointLine = 0;
  col = 0;
  variableValues: { [id: string]: string } = {};
}

export class WebLISP {
  private interpret = true; // false := generate code

  private output = "";
  private program: SExpr[] = [];

  private code = "";
  private genVarCtr = 0;

  private functions: { [id: string]: SExpr } = {};
  private variables: { [id: string]: SExpr }[] = [{}];
  private constants = new Set<string>(); // TODO: setf, ...

  private startTime = 0;
  private maxSeconds = Infinity;

  private breakpoints = new Set<number>();
  private debugInfo: DebugInfo[] = [];

  private check = true;

  public import(input: string): void {
    const lexer = new Lexer(input);
    const parser = new Parser();
    this.program = parser.parse(lexer);
  }

  public getOutput(): string {
    return this.output;
  }

  public getDebugInfo(): DebugInfo[] {
    return this.debugInfo;
  }

  public addBreakpoint(lineNo: number) {
    this.breakpoints.add(lineNo);
  }

  public compile(): string {
    this.interpret = false;
    this.genVarCtr = 0;
    let code = "";
    for (const sexpr of this.program) {
      this.code = "";
      const c = this.eval(sexpr);
      code += this.code + (c.data as string);
    }
    //this.code = `console.log(${this.code}.toString());`;
    console.log(code);
    code =
      runtimeCode +
      "var SExprType=RUNTIME.SExprType;" +
      "var SExpr=RUNTIME.SExpr;" +
      code;
    return code;
  }

  public run(reset = true, maxSeconds = Infinity): SExpr[] {
    this.interpret = true;
    this.output = "";
    this.debugInfo = [];
    if (reset) {
      this.functions = {};
      this.variables = [{}];
      this.constants = new Set<string>();
    }
    this.startTime = Date.now();
    this.maxSeconds = maxSeconds;
    const res: SExpr[] = [];
    for (const sexpr of this.program) {
      res.push(this.eval(sexpr));
    }
    return res;
  }

  private genVar(): string {
    return "__" + this.genVarCtr++;
  }

  private eval(sexpr: SExpr, createVar = false): SExpr {
    if (this.breakpoints.size > 0) {
      if (this.breakpoints.has(sexpr.srcRow)) {
        /*// TODO: message passing
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "blub", false);
        xhr.onload = function () {
          //if (this.status >= 200 && this.status < 300) {
          console.log(this.status);
          //}
        };
        xhr.send(null);*/
        const d = new DebugInfo();
        if (this.debugInfo.length > 0) {
          if (
            this.debugInfo[this.debugInfo.length - 1].breakpointLine ==
              sexpr.srcRow &&
            this.debugInfo[this.debugInfo.length - 1].col != sexpr.srcCol
          ) {
            this.debugInfo.pop();
          }
        }
        this.debugInfo.push(d);
        d.breakpointLine = sexpr.srcRow;
        d.col = sexpr.srcCol;
        const n = this.variables.length;
        for (let i = n - 1; i >= 0; i--) {
          for (const id in this.variables[i]) {
            const v = this.variables[i][id].toString();
            if (id in d.variableValues) continue;
            d.variableValues[id] = v;
          }
        }
      }
    }
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
        if (this.interpret) return sexpr;
        else return SExpr.atomSTRING("SExpr.atomNIL()");

      case T.T:
        if (this.interpret) return sexpr;
        else return SExpr.atomSTRING("SExpr.atomT()");

      case T.INT:
        if (this.interpret) return sexpr;
        else
          return SExpr.atomSTRING(
            "SExpr.atomINT(" + (sexpr.data as number) + ")"
          );

      case T.RATIO:
        if (this.interpret) return sexpr;
        else
          return SExpr.atomSTRING(
            "SExpr.atomRATIO(" +
              (sexpr.data as Ratio).numerator +
              "," +
              (sexpr.data as Ratio).denominator +
              ")"
          );

      case T.FLOAT:
        if (this.interpret) return sexpr;
        else
          return SExpr.atomSTRING(
            "SExpr.atomFLOAT(" + (sexpr.data as number) + ")"
          );

      case T.CHAR:
        if (this.interpret) return sexpr;
        else
          return SExpr.atomSTRING(
            "SExpr.atomCHAR(" + (sexpr.data as string) + ")"
          );

      case T.STR:
        if (this.interpret) return sexpr;
        else
          return SExpr.atomSTRING(
            "SExpr.atomSTR(" + (sexpr.data as string) + ")"
          );

      case T.ID: {
        if (!this.interpret) throw new RunError("case T.ID NOT IMPLEMENTED");
        const id = sexpr.data as string;
        const n = this.variables.length;
        for (let i = n - 1; i >= 0; i--)
          if (id in this.variables[i]) return this.variables[i][id];
        if (createVar) {
          this.variables[n - 1][id] = SExpr.atomNIL();
          return this.variables[n - 1][id];
        } else throw new RunError("unknown symbol " + id);
      }

      case T.CONS:
        switch (sexpr.car.type) {
          case T.INT:
          case T.RATIO:
          case T.FLOAT:
          case T.STR:
            throw new RunError("" + sexpr.car.data + " is not a function name");
          case T.CONS: {
            if (!this.interpret) throw new RunError("UNIMPLEMENTED");
            // TODO: checks
            const fun = this.eval(sexpr.car);
            if (this.check && fun.type !== T.DEFUN)
              throw new RunError("not a function");
            const res = this.call(fun.cdr.car, sexpr.cdr, fun.cdr.cdr);
            return res;
          }
          case T.ID:
            op = sexpr.car.data as string;
            switch (op) {
              case "+":
              case "*": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
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
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
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
              case ">":
              case ">=":
              case "<":
              case "<=": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
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
              case "AND": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                let res = SExpr.atomT();
                for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr) {
                  const t = this.eval(s.car);
                  if (t.type === T.NIL) return t;
                  res = t;
                }
                return res;
              }
              case "APPEND": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (APPEND list* obj)
                // TODO: obj must be used as CDR w/o copying all CONSES
                // TODO: must check, if list* contains lists!!
                let res = SExpr.atomNIL();
                let last = res;
                for (let t = sexpr.cdr; t.type !== T.NIL; t = t.cdr) {
                  const list = this.eval(t.car);
                  for (let u = list; u.type !== T.NIL; u = u.cdr) {
                    const n = SExpr.cons(u.car, SExpr.atomNIL());
                    if (res.type === T.NIL) {
                      res = last = n;
                    } else {
                      last.cdr = n;
                      last = last.cdr;
                    }
                  }
                }
                return res;
              }
              case "APPEND~": {
                if (this.check) this.checkArgCount(sexpr, 1);
                return this.appendTilde(this.eval(sexpr.cdr.car));
              }
              case "APPLY": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (APPLY function parameterList)
                if (this.check) this.checkMinArgCount(sexpr, 2);
                const fun = this.eval(sexpr.cdr.car);
                if (this.check && fun.type !== T.DEFUN)
                  throw new RunError("expected a function");
                const args = this.eval(sexpr.cdr.cdr.car);
                return this.call(fun.cdr.car, args, fun.cdr.cdr);
              }
              case "ATOM": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                return this.eval(sexpr.cdr.car).type !== T.CONS
                  ? SExpr.atomT()
                  : SExpr.atomNIL();
              }
              case "BACKQUOTE": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                return this.backquote(sexpr.cdr.car);
              }
              case "CAR":
                if (this.interpret) {
                  if (this.check) this.checkArgCount(sexpr, 1);
                  const param = this.eval(sexpr.cdr.car);
                  if (this.check && param.type !== T.CONS)
                    throw new RunError(op + " expects a list");
                  return param.car;
                } else {
                  return SExpr.atomSTRING(this.eval(sexpr.cdr.car) + ".car");
                }
              case "CDR":
                if (this.interpret) {
                  if (this.check) this.checkArgCount(sexpr, 1);
                  const param = this.eval(sexpr.cdr.car);
                  if (this.check && param.type !== T.CONS)
                    throw new RunError(op + " expects a list");
                  return param.cdr;
                } else {
                  return SExpr.atomSTRING(this.eval(sexpr.cdr.car) + ".cdr");
                }
              case "CHAR": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 2);
                const str = this.eval(sexpr.cdr.car);
                const pos = this.eval(sexpr.cdr.cdr.car);
                if (this.check && str.type !== T.STR)
                  throw new RunError("Expected a string");
                if (this.check && pos.type !== T.INT)
                  throw new RunError("Expected an integer index");
                const s = str.data as string;
                const p = pos.data as number;
                if (this.check && (p < 0 || p >= s.length))
                  throw new RunError("invalid string index");
                return SExpr.atomCHAR(s[p]);
              }
              case "COMMA":
                throw new RunError("COMMA NOT ALLOWED OUTSIDE OF BACKQUOTE");
              case "CONS": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 2);
                return SExpr.cons(
                  this.eval(sexpr.cdr.car),
                  this.eval(sexpr.cdr.cdr.car)
                );
              }
              case "CONSP": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                return param.type === T.CONS ? SExpr.atomT() : SExpr.atomNIL();
              }
              case "COPY-LIST": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                return this.copyList(param);
              }
              case "COS": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                if (this.check) this.checkIsNumber(param);
                return SExpr.atomFLOAT(Math.cos(param.toFloat()));
              }
              case "DEFCONSTANT": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // similar to DEFPARAMETER
                if (this.check) this.checkArgCount(sexpr, 2);
                const id = sexpr.cdr.car;
                const value = this.eval(sexpr.cdr.cdr.car);
                if (this.check && id.type !== T.ID)
                  throw new RunError("expected ID");
                const s = id.data as string;
                this.variables[0][s] = value;
                this.constants.add(s);
                return SExpr.global(s);
              }
              case "DEFPARAMETER": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // similar to DEFCONSTANT
                if (this.check) this.checkArgCount(sexpr, 2);
                const id = sexpr.cdr.car;
                const value = this.eval(sexpr.cdr.cdr.car);
                if (this.check && id.type !== T.ID)
                  throw new RunError("expected ID");
                const s = id.data as string;
                this.variables[0][s] = value;
                return SExpr.global(s);
              }
              case "DEFUN": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (DEFUN id (id*) expr*)
                if (this.check) {
                  this.checkMinArgCount(sexpr, 2);
                  if (
                    SExpr.nth(sexpr, 1).type !== T.ID ||
                    !(
                      SExpr.nth(sexpr, 2).type === T.CONS ||
                      SExpr.nth(sexpr, 2).type === T.NIL
                    )
                  )
                    throw new RunError("DEFUN is not well structured");
                }
                const id = SExpr.nth(sexpr, 1).data as string;
                const params_body = SExpr.nthcdr(sexpr, 2);
                this.functions[id] = params_body;
                return SExpr.defun(id, params_body);
              }
              case "DO": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (DO init cond body*)
                // init = ((id start update)*)
                // cond = (condCore expr*)
                let res = SExpr.atomNIL();
                const doScope: { [id: string]: SExpr } = {};
                this.variables.push(doScope);
                const init = SExpr.nth(sexpr, 1);
                const cond = SExpr.nth(sexpr, 2);
                const body = SExpr.nthcdr(sexpr, 3);
                if (
                  this.check &&
                  (init.type !== T.CONS || cond.type !== T.CONS)
                )
                  throw new RunError("DO is not well structured");
                // init
                for (let t = init; t.type !== T.NIL; t = t.cdr) {
                  const id = SExpr.nth(t.car, 0);
                  if (this.check && id.type !== T.ID)
                    throw new RunError("expected ID");
                  const expr = this.eval(SExpr.nth(t.car, 1));
                  doScope[id.data as string] = expr;
                }
                // do ...
                for (;;) {
                  // condition
                  let doBreak = false;
                  for (
                    let idx = 0, t = cond;
                    t.type !== T.NIL;
                    idx++, t = t.cdr
                  ) {
                    const u = this.eval(t.car);
                    if (idx == 0) {
                      if (u.type === T.T) doBreak = true;
                      else break;
                    }
                    if (idx > 0) res = u;
                  }
                  if (doBreak) break;
                  // body
                  for (let t = body; t.type !== T.NIL; t = t.cdr)
                    this.eval(t.car);
                  // update
                  for (let t = init; t.type !== T.NIL; t = t.cdr) {
                    const id = SExpr.nth(t.car, 0);
                    const expr = this.eval(SExpr.nth(t.car, 2));
                    doScope[id.data as string] = expr;
                  }
                }
                this.variables.pop();
                return res;
              }
              case "DOLIST": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (DOLIST (id list) expr*)
                let res = SExpr.atomNIL();
                const scope: { [id: string]: SExpr } = {};
                this.variables.push(scope);
                const id = SExpr.deepNth(sexpr, [1, 0]);
                if (this.check && id.type !== T.ID)
                  throw new RunError("expected ID");
                let list = this.eval(SExpr.deepNth(sexpr, [1, 1]));
                let expr = SExpr.nthcdr(sexpr, 2);
                while (list.type !== T.NIL) {
                  scope[id.data as string] = list.car;
                  for (let e = expr; e.type !== T.NIL; e = e.cdr)
                    this.eval(e.car);
                  list = list.cdr;
                }
                this.variables.pop();
                return res;
              }
              case "EQUALP": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 2);
                return SExpr.equalp(
                  this.eval(sexpr.cdr.car),
                  this.eval(sexpr.cdr.cdr.car)
                )
                  ? SExpr.atomT()
                  : SExpr.atomNIL();
              }
              case "FUNCALL": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (FUNCALL function parameter*)
                if (this.check) this.checkMinArgCount(sexpr, 2);
                const fun = this.eval(sexpr.cdr.car);
                if (this.check && fun.type !== T.DEFUN)
                  throw new RunError("expected a function");
                return this.call(fun.cdr.car, sexpr.cdr.cdr, fun.cdr.cdr);
              }
              case "FUNCTION": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                const idExpr = sexpr.cdr.car;
                if (this.check && idExpr.type !== T.ID)
                  throw new RunError("expected ID");
                const id = idExpr.data as string;
                if (this.check && id in this.functions == false)
                  throw new RunError("undefined function " + (id as string));
                return SExpr.defun(id, this.functions[id as string]);
              }
              case "IF": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (IF cond codeT codeF)
                this.checkMinArgCount(sexpr, 2);
                if (this.eval(SExpr.nth(sexpr, 1)).type !== T.NIL)
                  return this.eval(SExpr.nth(sexpr, 2));
                else return this.eval(SExpr.nth(sexpr, 3));
              }
              case "LAMBDA": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                return SExpr.defun("LAMBDA", SExpr.nthcdr(sexpr, 1));
              }
              case "LENGTH":
                if (this.interpret) {
                  if (this.check) this.checkArgCount(sexpr, 1);
                  let param = this.eval(sexpr.cdr.car);
                  let len;
                  for (len = 0; param.type === T.CONS; len++) param = param.cdr;
                  return SExpr.atomINT(len);
                } else {
                  const list = this.genVar();
                  const ctr = this.genVar();
                  const param = this.eval(sexpr.cdr.car);
                  const c =
                    `let ${list}=${param};\n` +
                    `let ${ctr};\n` +
                    `for(${ctr}=0; ${list}.type === SExprType.CONS; ${ctr}++)\n` +
                    `  ${list} = ${list}.cdr;\n`;
                  this.code += c;
                  return SExpr.atomSTRING(`SExpr.atomINT(${ctr})`);
                }
              case "LET": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // TODO: LET vs LET*
                // (LET ((id init)*) expr*)
                let res = SExpr.atomNIL();
                const letScope: { [id: string]: SExpr } = {};
                this.variables.push(letScope);
                const id_init = SExpr.nth(sexpr, 1);
                const expr = SExpr.nthcdr(sexpr, 2);
                for (let s = id_init; s.type !== T.NIL; s = s.cdr) {
                  if (this.check && SExpr.len(s.car) != 2)
                    throw new RunError("expected (id init)");
                  const id = SExpr.nth(s.car, 0);
                  if (this.check && id.type !== T.ID)
                    throw new RunError("expected ID");
                  const init = this.eval(SExpr.nth(s.car, 1));
                  letScope[id.data as string] = init;
                }
                for (let s = expr; s.type !== T.NIL; s = s.cdr)
                  res = this.eval(s.car);
                this.variables.pop();
                return res;
              }
              case "LIST": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
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
              case "LISTP": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                return param.type === T.CONS || param.type === T.NIL
                  ? SExpr.atomT()
                  : SExpr.atomNIL();
              }
              case "MEMBER": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 2);
                const needle = this.eval(SExpr.nth(sexpr, 1));
                const haystack = this.eval(SExpr.nth(sexpr, 2));
                let res = SExpr.atomNIL();
                // TODO: "equalp" is not used per default in common lisp
                for (let h = haystack; h.type !== T.NIL; h = h.cdr)
                  if (SExpr.equalp(needle, h.car)) res = h;
                return res;
              }
              case "NOT": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // same as NULL
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                return param.type === T.NIL ? SExpr.atomT() : SExpr.atomNIL();
              }
              case "NTH": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (NTH idx list)
                if (this.check) this.checkArgCount(sexpr, 2);
                const idx = sexpr.cdr.car;
                const list = this.eval(sexpr.cdr.cdr.car);
                if (this.check && idx.type !== T.INT)
                  throw new RunError("expected an integer index");
                const i = idx.data as number;
                if (this.check && i < 0)
                  throw new RunError("expected a non-negative integer index");
                return SExpr.nth(list, i);
              }
              case "NTHCDR": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (NTHCDR idx list)
                if (this.check) this.checkArgCount(sexpr, 2);
                const idx = sexpr.cdr.car;
                const list = this.eval(sexpr.cdr.cdr.car);
                if (this.check && idx.type !== T.INT)
                  throw new RunError("expected an integer index");
                const i = idx.data as number;
                if (this.check && i < 0)
                  throw new RunError("expected a non-negative integer index");
                return SExpr.nthcdr(list, i);
              }
              case "NULL": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // same as NOT
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                return param.type === T.NIL ? SExpr.atomT() : SExpr.atomNIL();
              }
              case "NUMBERP": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                return param.type === T.INT ||
                  param.type === T.FLOAT ||
                  param.type === T.RATIO
                  ? SExpr.atomT()
                  : SExpr.atomNIL();
              }
              case "OR": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                let res = SExpr.atomNIL();
                for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr) {
                  const t = this.eval(s.car);
                  if (t.type !== T.NIL) return t;
                  res = t;
                }
                return res;
              }
              case "PROGN": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                let res = SExpr.atomNIL();
                for (let s = sexpr.cdr; s.type === T.CONS; s = s.cdr)
                  res = this.eval(s.car);
                return res;
              }
              case "QUOTE": {
                if (this.interpret) {
                  if (this.check) this.checkArgCount(sexpr, 1);
                  return sexpr.cdr.car;
                } else {
                  return SExpr.atomSTRING(sexpr.cdr.car.toCode());
                }
              }
              case "REMOVE": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 2);
                const param1 = sexpr.cdr.car;
                const param2 = this.eval(sexpr.cdr.cdr.car);
                return param2.remove(param1);
              }
              case "REWRITE": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkMinArgCount(sexpr, 4);
                // TODO: check, if number of arguments minus 1 divides 3 w/o rest
                // TODO: stop infinite loops
                // term to be rewritten
                const u = this.eval(SExpr.nth(sexpr, 1));
                let v = u;
                const s: SExpr[] = []; // evaluated left-hand sides of rules
                const cond: SExpr[] = []; // unevaluated conditions of rules
                const t: SExpr[] = []; // unevaluated right-hand sides of rules
                // read rules
                let x = SExpr.nthcdr(sexpr, 2);
                while (x.type !== T.NIL) {
                  s.push(this.eval(x.car));
                  x = x.cdr;
                  cond.push(x.car);
                  x = x.cdr;
                  t.push(x.car);
                  x = x.cdr;
                }
                // rewrite
                const n = s.length; // number of rules
                return this.rewrite(n, s, cond, t, v);
              }
              case "TAN": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                if (this.check) this.checkIsNumber(param);
                return SExpr.atomFLOAT(Math.tan(param.toFloat()));
              }
              case "THIRD": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                return SExpr.nth(param, 2);
              }
              case "TYPEP": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 2);
                const expr = this.eval(sexpr.cdr.car);
                const id = this.eval(sexpr.cdr.cdr.car);
                if (this.check && id.type !== T.ID)
                  throw new RunError("expected ID as second param");
                const s = id.data as string;
                if (
                  this.check &&
                  ["INTEGER", "FLOAT", "RATIO"].includes(s) == false
                )
                  throw new RunError("unexpected TYPE " + s);
                if (
                  (expr.type === T.INT && s === "INTEGER") ||
                  (expr.type === T.FLOAT && s === "FLOAT") ||
                  (expr.type === T.RATIO && s === "RATIO")
                )
                  return SExpr.atomT();
                else SExpr.atomNIL();
              }
              case "SETF": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // (SETF place expr place expr ...)
                const n = SExpr.len(sexpr);
                if (this.check) this.checkEvenArgCount(sexpr);
                let res = SExpr.atomNIL();
                for (let s = sexpr.cdr; s.type !== T.NIL; s = s.cdr) {
                  const place = s.car;
                  res = this.eval(place, true); // true := create if not exists
                  s = s.cdr; // next is expr
                  const value = this.eval(s.car);
                  res.set(value);
                }
                return res;
              }
              case "SIN": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                if (this.check) this.checkArgCount(sexpr, 1);
                let param = this.eval(sexpr.cdr.car);
                if (this.check) this.checkIsNumber(param);
                return SExpr.atomFLOAT(Math.sin(param.toFloat()));
              }
              case "SUBSTITUTE":
              case "SUBST": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // TODO: SUBSTITUTE AND SUBST ARE NOT EQUAL!!
                if (this.check) this.checkArgCount(sexpr, 3);
                const newExpr = this.eval(SExpr.nth(sexpr, 1));
                const oldExpr = this.eval(SExpr.nth(sexpr, 2));
                const tree = this.eval(SExpr.nth(sexpr, 3));
                const res = SExpr.subst(newExpr, oldExpr, tree);
                return res;
              }
              case "TERPRI": {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                this.output += "\n";
                return SExpr.atomNIL();
              }
              case "WRITE":
                if (this.interpret) {
                  if (this.check) this.checkArgCount(sexpr, 1);
                  const param = this.eval(sexpr.cdr.car);
                  this.output += param.toString();
                  console.log(param.toString());
                  return param;
                } else {
                  const v = this.genVar();
                  const c = `let ${v} = ${this.eval(sexpr.cdr.car)};`;
                  this.code += c;
                  this.code += `console.log(${v}.toString());`;
                  return SExpr.atomSTRING(v);
                }
              default: {
                if (!this.interpret) throw new RunError("UNIMPLEMENTED");
                // -- call user function --
                const fun = this.functions[op];
                if (this.check && fun == undefined)
                  throw new RunError("unknown function " + op);
                return this.call(fun.car, sexpr.cdr, fun.cdr);
              }
            }
          default:
            throw new RunError("not allowed");
        }
      default:
        throw new RunError("unimplemented sexpr type " + sexpr.type);
    }
  }

  private rewrite(
    n: number,
    s: SExpr[],
    cond: SExpr[],
    t: SExpr[],
    v: SExpr
  ): SExpr {
    // rewrite
    let change;
    let numChanges = 0;
    do {
      change = false;
      // run recursively
      if (v.type === T.CONS) {
        v.car = this.rewrite(n, s, cond, t, v.car);
        v.cdr = this.rewrite(n, s, cond, t, v.cdr);
      }
      // for all rules  s[cond]->t : find matching rule for v
      for (let i = 0; i < n; i++) {
        const scope: { [id: string]: SExpr } = {};
        this.variables.push(scope);
        const matching = SExpr.match(s[i], v, scope);
        if (matching && this.eval(cond[i]).type !== T.NIL) {
          // TODO: only log in verbose mode
          const vOldStr = v.toString();
          v = this.eval(SExpr.clone(t[i]));
          // TODO: appendTilde ONLY if "~" is present (add APPEND~ by parser if needed!)
          v = this.appendTilde(v);
          console.log(
            "REWROTE " +
              vOldStr +
              " -> " +
              v.toString() +
              " (USING RULE " +
              s[i].toString() +
              " -> " +
              t[i].toString() +
              ")"
          );
          change = true;
          numChanges++;
        }
        this.variables.pop();
      }
    } while (change);
    // return result
    return v;
  }

  private appendTilde(s: SExpr): SExpr {
    if (s.type !== T.CONS) return s;
    let res = s;
    let change;
    do {
      change = false;
      let t = res;
      let last: SExpr = null;
      while (t.type != T.NIL) {
        if (t.car.type === T.ID && (t.car.data as string) === "~") {
          change = true;
          if (t.cdr.car.type !== T.CONS && t.cdr.car.type !== T.NIL)
            throw new RunError("append~ can only append lists");
          const subList = this.copyList(t.cdr.car);
          t = t.cdr.cdr;
          if (subList.type === T.NIL) {
            if (last == null) res = t;
            else last.cdr = t;
          } else {
            if (last == null) res = subList;
            else last.cdr = subList;
            const newLast = this.getLastCdr(subList);
            if (newLast != null) last = newLast;
            last.cdr = t;
          }
        } else {
          last = t;
          t = t.cdr;
        }
      }
    } while (change);
    // run recursively
    for (let t = res; t.type !== T.NIL; t = t.cdr)
      if (t.car.type === T.CONS) t.car = this.appendTilde(t.car);
    return res;
  }

  private copyList(s: SExpr): SExpr {
    let res: SExpr = SExpr.atomNIL();
    let current: SExpr = null;
    let last: SExpr = null;
    for (let t = s; t.type != T.NIL; t = t.cdr) {
      current = SExpr.cons(t.car, SExpr.atomNIL());
      if (last == null) res = current;
      else last.cdr = current;
      last = current;
    }
    return res;
  }

  private getLastCdr(s: SExpr): SExpr {
    let res = s;
    while (s.type !== T.NIL) {
      res = s;
      s = s.cdr;
    }
    return res;
  }

  private backquote(s: SExpr): SExpr {
    if (s.type === T.CONS) {
      if (s.car.type === T.ID && (s.car.data as string) === "COMMA")
        return this.eval(s.cdr.car);
      s.car = this.backquote(s.car);
      s.cdr = this.backquote(s.cdr);
    }
    return s;
  }

  private call(params: SExpr, args: SExpr, body: SExpr): SExpr {
    // open scope
    const scope: { [id: string]: SExpr } = {};
    this.variables.push(scope);
    // create parameter variables
    let arg, param: SExpr;
    for (
      arg = args, param = params;
      param.type !== T.NIL;
      arg = arg.cdr, param = param.cdr
    ) {
      if (this.check && arg.type === T.NIL)
        throw new RunError("too few arguments");
      const paramId = param.car;
      if (this.check && paramId.type !== T.ID)
        throw new RunError("parameter must be an ID");
      scope[paramId.data as string] = this.eval(arg.car);
    }
    if (this.check && arg.type !== T.NIL)
      throw new RunError("too many arguments");
    // run body code
    let res = SExpr.atomNIL();
    for (; body.type !== T.NIL; body = body.cdr) {
      res = this.eval(body.car);
    }
    // close scope
    this.variables.pop();

    return res;
  }

  private checkArgCount(sexpr: SExpr, n: number): void {
    // TODO: row, col of source file
    if (SExpr.len(sexpr) != n + 1)
      throw new RunError("expected " + n + " argument" + (n > 0 ? "s" : "#"));
  }

  private checkMinArgCount(sexpr: SExpr, n: number): void {
    // TODO: row, col of source file
    if (SExpr.len(sexpr) < n + 1)
      throw new RunError("expected " + n + "+ argument" + (n > 0 ? "s" : "#"));
  }

  private checkEvenArgCount(sexpr: SExpr): void {
    // TODO: row, col of source file
    if ((SExpr.len(sexpr) - 1) % 2 != 0)
      throw new RunError("expected an even number of arguments");
  }

  private checkIsNumber(sexpr: SExpr): void {
    // TODO: row, col of source file
    if (
      sexpr.type !== T.INT &&
      sexpr.type !== T.FLOAT &&
      sexpr.type !== T.RATIO
    )
      throw new RunError("expected a number");
  }
}

export class CompileError extends Error {
  constructor(msg: string) {
    super("Error: " + msg);
    this.name = "CompileError";
  }
}

export class RunError extends Error {
  constructor(msg: string) {
    super("Error: " + msg);
    this.name = "RunError";
  }
}
