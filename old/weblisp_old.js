/* webLISP, 2022 by Andreas Schwenk

LISP tutorials:
- https://lisp-lang.org/learn/getting-started/
- https://gigamonkeys.com/book/
- https://jtra.cz/stuff/lisp/sclr/index.html

TODO:
- convert to uppercase while reading
- use two namespaces: functions and variables:
  https://wiki.c2.com/?SchemeLanguage
- (list* 1 2 3 4 5) vs (list 1 2 3 4 5) -> dotted lists

Break 15 [17]> (car (cons 1 2))
1
Break 15 [17]> (cdr (cons 1 2))
2
Break 15 [17]> (cdr (list 1 2))
(2)
Break 15 [17]> (cdr (list* 1 2))
2
Break 15 [17]> (cdr (list* 1 2 3))
(2 . 3)

Break 16 [18]> (cons 1 '(2 3))
(1 2 3)
Break 16 [18]> (cons 1 '(2))
(1 2)
Break 16 [18]> (cons 1 '())
(1)
Break 16 [18]> (cons 1 2)
(1 . 2)

Break 18 [20]> (car '((1 2) 3))
(1 2)
Break 18 [20]> (cdr '((1 2) 3))
(3)

https://www.tutorialspoint.com/lisp/lisp_lists.htm

*/

class WebLISP {
  constructor() {
    this.input = "";
    this.sexpr = null;
    this.output = "";

    this.startTime = 0;
    this.maxSeconds = Infinity;

    this.functions = {};
    this.memoization = {};
    this.vars = [{}];
  }

  getOutput() {
    return this.output;
  }

  /**
   * Import source file.
   * @param {string} input
   */
  import(input) {
    // remove comments
    let lines = input.split("\n");
    let lines2 = [];
    for (const line of lines) {
      const tokens = line.split(";");
      lines2.push(tokens[0]);
    }
    this.input = lines2.join("\n");

    // tokenize
    const tokens = [];
    const n = this.input.length;
    let row = 1,
      col = 1; // TODO
    let tk = "";
    for (let i = 0; i < n; i++) {
      const ch = this.input[i];
      switch (ch) {
        case "(":
        case ")":
        case "+":
        case "*":
          if (tk.length > 0) {
            tokens.push(tk);
            tk = "";
          }
          tokens.push(ch);
          break;
        case " ":
        case "\t":
        case "\n":
          if (tk.length > 0) {
            tokens.push(tk);
            tk = "";
          }
          break;
        default:
          tk += ch;
      }
    }
    if (tk.length > 0) {
      tokens.push(tk);
      tk = "";
    }

    // build s-expressions
    let sexpr = ["_PROG"];
    let stack = [];
    for (const token of tokens) {
      switch (token) {
        case "(":
          stack.push(sexpr);
          sexpr = [];
          break;
        case ")":
          if (stack.length == 0) throw new Error('")" is not allowed');
          let x = stack.pop();
          x.push(sexpr);
          sexpr = x;
          break;
        default:
          if (token.length > 0 && token[0] >= "0" && token[0] <= "9")
            sexpr.push(parseFloat(token));
          else sexpr.push(token);
          break;
      }
    }
    this.sexpr = sexpr;
  }

  run(maxSeconds = Infinity) {
    this.output = "";
    this.functions = {};
    this.vars = [{}];
    this.memoization = {};
    this.startTime = Date.now();
    this.maxSeconds = maxSeconds;
    this.eval(this.sexpr);
  }

  eval(sexpr) {
    if (
      this.maxSeconds != Infinity &&
      (Date.now() - this.startTime) / 1000 > this.maxSeconds
    )
      throw new Error("max allowed runtime exceeded!");
    if (Array.isArray(sexpr)) {
      if (sexpr.length == 0) return null;
      let car = sexpr[0];
      let cdr = sexpr.slice(1);
      let id, sum, prod, n, x, y, val;
      let found;
      switch (car) {
        case "_PROG":
          for (const c of cdr) this.eval(c);
          return null;
        case "car":
          y = this.eval(cdr);
          return y.length > 0 ? y[0] : null;
        case "cdr":
          y = this.eval(cdr);
          return y.length > 0 ? y.slice(1) : null;
        case "cons":
          // TODO: cyclic data structures, ...
          if (cdr.length != 2) throw new Error("cons requires 2 arguments");
          y = this.eval(cdr);
          return cdr;
        case "length":
          if (cdr.length != 1) throw new Error("length requires 1 argument");
          y = this.eval(cdr[0]);
          if (Array.isArray(y) == false)
            throw new Error("arg of length is not a list");
          return y.length;
        case "write":
          val = this.eval(cdr[0]);
          console.log(val);
          this.output += "" + val;
          return val;
        case "+":
          sum = 0;
          for (const c of cdr) sum += this.eval(c);
          return sum;
        case "*":
          prod = 1;
          for (const c of cdr) prod *= this.eval(c);
          return prod;
        case "-":
          // TODO: test with 0, 1, 2, 3, ... args
          sum = 0;
          n = cdr.length;
          for (let i = 0; i < n; i++) {
            if (i == 1) sum = -sum;
            sum -= this.eval(cdr[i]);
          }
          return sum;
        case "/":
          // TODO: integer vs floating point
          // TODO: 0 args
          n = cdr.length;
          prod = this.eval(cdr[0]);
          if (n == 1) return 1 / prod;
          else {
            for (let i = 1; i < n; i++) prod /= this.eval(cdr[i]);
            return prod;
          }
        case "<":
          // TODO: error handling
          return this.eval(cdr[0]) < this.eval(cdr[1]);
        case ">":
          // TODO: error handling
          return this.eval(cdr[0]) > this.eval(cdr[1]);
        case "terpri":
          // TODO: error handling
          this.output += "\n";
          return null;
        case "defun":
          id = cdr[0];
          this.functions[id] = sexpr;
          return null;
        case "defvar":
        case "setq":
          // TODO: error handling
          // forbid settings constants (e.g. T)
          id = cdr[0];
          val = this.eval(cdr[1]);
          found = false;
          for (let i = this.vars.length - 1; i >= 0; i--) {
            const v = this.vars[i];
            if (id in v) {
              v[id] = val;
              found = true;
              break;
            }
          }
          if (!found) this.vars[this.vars.length - 1][id] = val;
          return val;
        case "let":
        case "let*":
          // TODO: error handling
          this.vars.push({});
          if (car === "let*") {
            for (const decl of cdr[0])
              this.vars[this.vars.length - 1][decl[0]] = this.eval(decl[1]);
          } else {
            // car === 'let'
            let y = [],
              i = 0;
            for (const decl of cdr[0]) y.push(this.eval(decl[1]));
            for (const decl of cdr[0])
              this.vars[this.vars.length - 1][decl[0]] = y[i++];
          }
          y = null;
          for (const c of cdr.slice(1)) y = this.eval(c);
          this.vars.pop();
          return y;
        case "if":
          // TODO: error here
          if (this.eval(cdr[0])) return this.eval(cdr[1]);
          else if (cdr.length == 3) return this.eval(cdr[2]);
          else return null;
        case "dotimes":
          // TODO: error handling
          n = this.eval(cdr[0][1]);
          for (let k = 0; k < n; k++) {
            this.vars[this.vars.length - 1][cdr[0][0]] = k;
            y = null;
            for (const c of cdr.slice(1)) y = this.eval(c);
          }
          return y;
        case "sin":
          if (cdr.length != 1) throw new Error("sin requires 1 argument");
          return Math.sin(this.eval(cdr[0]));
        case "cos":
          if (cdr.length != 1) throw new Error("cos requires 1 argument");
          return Math.cos(this.eval(cdr[0]));
        case "exp":
          if (cdr.length != 1) throw new Error("exp requires 1 argument");
          return Math.exp(this.eval(cdr[0]));
        case "sqrt": // TODO: complex
          if (cdr.length != 1) throw new Error("sqrt requires 1 argument");
          return Math.sqrt(this.eval(cdr[0]));
        case "zerop":
          if (cdr.length != 1) throw new Error("zerop requires 1 argument");
          return eval(cdr[0]) == 0 ? true : null;
        case "random":
          if (cdr.length != 1) throw new Error("random requires 1 argument");
          x = this.eval(cdr[0]);
          if (Number.isInteger(cdr[0])) return Math.floor(Math.random() * x);
          else return Math.random() * x;
        case "min":
          if (cdr.length < 1)
            throw new Error("min requires at least one argument");
          x = [];
          for (const c of cdr) x.push(this.eval(c));
          y = Infinity;
          for (const xi of x) if (xi < y) y = xi;
          return y;
        case "max":
          if (cdr.length < 1)
            throw new Error("min requires at least one argument");
          x = [];
          for (const c of cdr) x.push(this.eval(c));
          y = -Infinity;
          for (const xi of x) if (xi > y) y = xi;
          return y;
        default:
          if (car in this.functions) {
            // call function
            const fun = this.functions[car];
            n = fun.length;
            x = [];
            for (let i = 0; i < fun[2].length; i++) x.push(this.eval(cdr[i]));
            y = null;
            if (
              false &&
              fun[2].length == 1 &&
              car in this.memoization &&
              x[0] in this.memoization[car]
            ) {
              // TODO: memoization can be used ONLY if function body has no side effects
              y = this.memoization[car][x[0]];
            } else {
              this.vars.push({});
              for (let i = 0; i < fun[2].length; i++)
                this.vars[this.vars.length - 1][fun[2][i]] = x[i];
              for (let i = 3; i < n; i++) y = this.eval(fun[i]);
              this.vars.pop();
            }
            if (fun[2].length == 1) {
              // unary function
              if (car in this.memoization == false) this.memoization[car] = {};
              this.memoization[car][x[0]] = y;
            }
            return y;
          } else {
            throw new Error('error: unknown CAR "' + car + '"');
          }
      }
    } else {
      if (typeof sexpr === "number") return sexpr;
      for (let i = this.vars.length - 1; i >= 0; i--) {
        const v = this.vars[i];
        if (sexpr in v) return v[sexpr];
      }
      throw new Error('error: unimplemented SEXPR "' + sexpr + '"');
    }
  }

  sexpr_toString(sexpr) {
    if (Array.isArray(sexpr)) {
      let s = "(";
      for (let i = 0; i < sexpr.length; i++) {
        if (i > 0) s += " ";
        s += this.sexpr_toString(sexpr[i]);
      }
      s += ")";
      return s;
    } else {
      if (sexpr == null) return "NIL";
      else if (sexpr == true) return "T";
      else return "" + sexpr;
    }
  }
}

exports.WebLISP = WebLISP;
