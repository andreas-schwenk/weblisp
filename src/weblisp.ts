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
import { Ratio, SExprType as T } from "./types";
import { runtimeCode } from "./_runtimeCode";
import { runREWRITE, runREWRITE_core } from "./runREWRITE";
import { runCAR } from "./runCAR";
import { runCDR } from "./runCDR";
import { runAND } from "./runAND";
import { runAPPEND, runAPPEND_TILDE, runAPPEND_TILDE_core } from "./runAPPEND";
import { runAPPLY } from "./runAPPLY";
import { runATOM } from "./runATOM";
import { runCONS } from "./runCONS";
import { runCHAR } from "./runCHAR";
import { runCONSP } from "./runCONSP";
import { runCOPY_LIST } from "./runCOPY_LIST";
import { runCOS } from "./runCOS";
import { runDEFCONST_PARAM } from "./runDEFCONST_PARAM";
import { runDEFUN } from "./runDEFUN";
import { runDO } from "./runDO";
import { runDOLIST } from "./runDOLIST";
import { runEQUALP } from "./runEQUALP";
import { runFUNCALL } from "./runFUNCALL";
import { runFUNCTION } from "./runFUNCTION";
import { runIF } from "./runIF";
import { runLAMBDA } from "./runLAMBDA";
import { runLENGTH } from "./runLENGTH";
import { runLET } from "./runLET";
import { runLIST } from "./runLIST";
import { runLISTP } from "./runLISTP";
import { runMEMBER } from "./runMEMBER";
import { runNOT } from "./runNOT";
import { runNTH } from "./runNTH";
import { runNTHCDR } from "./runNTHCDR";
import { runNULL } from "./runNULL";
import { runNUMBERP } from "./runNUMBERP";
import { runOR } from "./runOR";
import { runPROGN } from "./runPROGN";
import { runQUOTE } from "./runQUOTE";
import { runREMOVE } from "./runREMOVE";
import { runSETF } from "./runSETF";
import { runSIN } from "./runSIN";
import { runSUBSTITUTE } from "./runSUBSTITUTE";
import { runTAN } from "./runTAN";
import { runTERPRI } from "./runTERPRI";
import { runTHIRD } from "./runTHIRD";
import { runTYPEP } from "./runTYPEP";
import { runWRITE } from "./runWRITE";
import { run__COMPARE, run__MINUS__DIV, run__PLUS__MUL } from "./run_ARITH";
import { runBACKQUOTE, runBACKQUOTE_core } from "./runBACKQUOTE";
import { runASSERT } from "./runASSERT";

export class DebugInfo {
  breakpointLine = 0;
  col = 0;
  variableValues: { [id: string]: string } = {};
}

export class RunError extends Error {
  constructor(msg: string) {
    super("Error: " + msg);
    this.name = "RunError";
  }
}

export class WebLISP {
  protected interpret = true; // false := generate code

  protected output = "";
  private program: SExpr[] = [];

  protected code = "";
  private genVarCtr = 0;

  protected functions: { [id: string]: SExpr } = {};
  protected variables: { [id: string]: SExpr }[] = [{}];
  protected constants = new Set<string>(); // TODO: setf, ...

  private startTime = 0;
  private maxSeconds = Infinity;

  private breakpoints = new Set<number>();
  private debugInfo: DebugInfo[] = [];

  protected check = true;

  protected run__PLUS__MUL = run__PLUS__MUL;
  protected run__MINUS__DIV = run__MINUS__DIV;
  protected run__COMPARE = run__COMPARE;
  protected runAND = runAND;
  protected runAPPEND = runAPPEND;
  protected runAPPEND_TILDE = runAPPEND_TILDE;
  protected runAPPEND_TILDE_core = runAPPEND_TILDE_core;
  protected runAPPLY = runAPPLY;
  protected runASSERT = runASSERT;
  protected runATOM = runATOM;
  protected runBACKQUOTE = runBACKQUOTE;
  protected runBACKQUOTE_core = runBACKQUOTE_core;
  protected runCAR = runCAR;
  protected runCDR = runCDR;
  protected runCHAR = runCHAR;
  protected runCONS = runCONS;
  protected runCONSP = runCONSP;
  protected runCOPY_LIST = runCOPY_LIST;
  protected runCOS = runCOS;
  protected runDEFCONST_PARAM = runDEFCONST_PARAM;
  protected runDEFUN = runDEFUN;
  protected runDO = runDO;
  protected runDOLIST = runDOLIST;
  protected runEQUALP = runEQUALP;
  protected runFUNCALL = runFUNCALL;
  protected runFUNCTION = runFUNCTION;
  protected runIF = runIF;
  protected runLAMBDA = runLAMBDA;
  protected runLENGTH = runLENGTH;
  protected runLET = runLET;
  protected runLIST = runLIST;
  protected runLISTP = runLISTP;
  protected runMEMBER = runMEMBER;
  protected runNOT = runNOT;
  protected runNTH = runNTH;
  protected runNTHCDR = runNTHCDR;
  protected runNULL = runNULL;
  protected runNUMBERP = runNUMBERP;
  protected runOR = runOR;
  protected runPROGN = runPROGN;
  protected runQUOTE = runQUOTE;
  protected runREMOVE = runREMOVE;
  protected runREWRITE = runREWRITE;
  protected runREWRITE_core = runREWRITE_core;
  protected runSETF = runSETF;
  protected runSIN = runSIN;
  protected runSUBSTITUTE = runSUBSTITUTE;
  protected runTAN = runTAN;
  protected runTERPRI = runTERPRI;
  protected runTHIRD = runTHIRD;
  protected runTYPEP = runTYPEP;
  protected runWRITE = runWRITE;

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
    //console.log(code);
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

  protected genVar(): string {
    return "__" + this.genVarCtr++;
  }

  protected eval(sexpr: SExpr, createVar = false): SExpr {
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
              case "*":
                return this.run__PLUS__MUL(sexpr, op);
              case "-":
              case "/":
                return this.run__MINUS__DIV(sexpr, op);
              case ">":
              case ">=":
              case "<":
              case "<=":
                return this.run__COMPARE(sexpr, op);
              case "AND":
                return this.runAND(sexpr);
              case "APPEND":
                return this.runAPPEND(sexpr);
              case "APPEND~":
                return this.runAPPEND_TILDE(sexpr);
              case "APPLY":
                return this.runAPPLY(sexpr);
              case "ASSERT":
                return this.runASSERT(sexpr);
              case "ATOM":
                return this.runATOM(sexpr);
              case "BACKQUOTE":
                return this.runBACKQUOTE(sexpr);
              case "CAR":
                return this.runCAR(sexpr);
              case "CDR":
                return this.runCDR(sexpr);
              case "CHAR":
                return this.runCHAR(sexpr);
              case "COMMA":
                throw new RunError("COMMA NOT ALLOWED OUTSIDE OF BACKQUOTE");
              case "CONS":
                return this.runCONS(sexpr);
              case "CONSP":
                return this.runCONSP(sexpr);
              case "COPY-LIST":
                return this.runCOPY_LIST(sexpr);
              case "COS":
                return this.runCOS(sexpr);
              case "DEFCONSTANT":
                return this.runDEFCONST_PARAM(sexpr, true);
              case "DEFPARAMETER":
                return this.runDEFCONST_PARAM(sexpr, false);
              case "DEFUN":
                return this.runDEFUN(sexpr);
              case "DO":
                return this.runDO(sexpr);
              case "DOLIST":
                return this.runDOLIST(sexpr);
              case "EQUALP":
                return this.runEQUALP(sexpr);
              case "FUNCALL":
                return this.runFUNCALL(sexpr);
              case "FUNCTION":
                return this.runFUNCTION(sexpr);
              case "IF":
                return this.runIF(sexpr);
              case "LAMBDA":
                return this.runLAMBDA(sexpr);
              case "LENGTH":
                return this.runLENGTH(sexpr);
              case "LET":
                return this.runLET(sexpr);
              case "LIST":
                return this.runLIST(sexpr);
              case "LISTP":
                return this.runLISTP(sexpr);
              case "MEMBER":
                return this.runMEMBER(sexpr);
              case "NOT":
                return this.runNOT(sexpr);
              case "NTH":
                return this.runNTH(sexpr);
              case "NTHCDR":
                return this.runNTHCDR(sexpr);
              case "NULL":
                return this.runNULL(sexpr);
              case "NUMBERP":
                return this.runNUMBERP(sexpr);
              case "OR":
                return this.runOR(sexpr);
              case "PROGN":
                return this.runPROGN(sexpr);
              case "QUOTE":
                return this.runQUOTE(sexpr);
              case "REMOVE":
                return this.runREMOVE(sexpr);
              case "REWRITE":
                return this.runREWRITE(sexpr);
              case "SETF":
                return this.runSETF(sexpr);
              case "SIN":
                return this.runSIN(sexpr);
              case "SUBSTITUTE":
              case "SUBST":
                return this.runSUBSTITUTE(sexpr);
              case "TAN":
                return this.runTAN(sexpr);
              case "TERPRI":
                return this.runTERPRI(sexpr);
              case "THIRD":
                return this.runTHIRD(sexpr);
              case "TYPEP":
                return this.runTYPEP(sexpr);
              case "WRITE":
                return this.runWRITE(sexpr);
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

  protected call(params: SExpr, args: SExpr, body: SExpr): SExpr {
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

  protected checkArgCount(sexpr: SExpr, n: number): void {
    // TODO: row, col of source file
    if (SExpr.len(sexpr) != n + 1)
      throw new RunError("expected " + n + " argument" + (n > 0 ? "s" : "#"));
  }

  protected checkMinArgCount(sexpr: SExpr, n: number): void {
    // TODO: row, col of source file
    if (SExpr.len(sexpr) < n + 1)
      throw new RunError("expected " + n + "+ argument" + (n > 0 ? "s" : "#"));
  }

  protected checkEvenArgCount(sexpr: SExpr): void {
    // TODO: row, col of source file
    if ((SExpr.len(sexpr) - 1) % 2 != 0)
      throw new RunError("expected an even number of arguments");
  }

  protected checkIsNumber(sexpr: SExpr): void {
    // TODO: row, col of source file
    if (
      sexpr.type !== T.INT &&
      sexpr.type !== T.FLOAT &&
      sexpr.type !== T.RATIO
    )
      throw new RunError("expected a number");
  }
}
