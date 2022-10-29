/*
    time to run pi.lisp on macBook Air M2
    CLISP: 15s
    SBCL: <1s
    this implementation: 35s (without compilation: 45s)

    pi.js
    node.js: <1s
*/


const assert = require('assert');
const fs = require('fs');
const process = require('process');

let input = fs.readFileSync('pi.lisp', 'utf-8');
console.log(input);

// remove comments
let lines = input.split('\n');
let lines2 = [];
for(const line of lines) {
    const tokens = line.split(';');
    lines2.push(tokens[0]);
}
input = lines2.join('\n');

// tokenize
const tokens = [];
const n = input.length;
let row=1, col=1; // TODO
let tk = '';
for (let i=0; i<n; i++) {
    const ch = input[i];
    switch(ch) {
        case '(':
        case ')':
        case '+':
        case '*':
            if (tk.length > 0) {
                tokens.push(tk);
                tk = '';
            }
            tokens.push(ch);
            break;
        case ' ':
        case '\t':
        case '\n':
            if (tk.length > 0) {
                tokens.push(tk);
                tk = '';
            }
            break;
        default:
            tk += ch;            
    }
}
if (tk.length > 0) {
    tokens.push(tk);
    tk = '';
}

//console.log(tokens);

let stack = [];
let list = ['_PROG'];
for (const token of tokens) {
    switch (token) {
        case '(':
            stack.push(list);
            list = [];
            break;
        case ')': // TODO: check, if valid!
            let x = stack.pop();
            x.push(list);
            list = x;
            break;
        default:
            if (token.length > 0 && token[0]>='0' && token[0]<='9')
                list.push(parseFloat(token));
            else
                list.push(token);
            break;
    }
}

function sexpr_toString(sexpr) {
    if (Array.isArray(sexpr)) {
        let s = '(';
        for (let i=0; i<sexpr.length; i++) {
            if (i > 0) s += ' ';
            s += sexpr_toString(sexpr[i]);
        }
        s += ')';
        return s;
    }
    else 
        return '' + sexpr;
}

console.log(sexpr_toString(list) + '\n');

// TODO: use opcodes (integers)
const INSTR_add = 'INSTR_add';
const INSTR_sub = 'INSTR_sub';
const INSTR_mul = 'INSTR_mul';
const INSTR_div = 'INSTR_div';
const INSTR_push_sym = 'INSTR_push_sym';
const INSTR_push_const = 'INSTR_push_const';
const INSTR_store_sym = 'INSTR_store_sym';
//const INSTR_loop = 'INSTR_loop';
const INSTR_branch_geq = 'INSTR_branch_geq';
const INSTR_jump = 'INSTR_jump';
const INSTR_inc_sym = 'INSTR_inc_sym';

function compile_js(sexpr, processUnary=false) {
    let code = [];
    let sub = [];
    if (Array.isArray(sexpr)) {
        let car = sexpr[0];
        let cdr = sexpr.slice(1);
        // TODO: check, if child elements are compilable!
        switch (car) {
            case '+':
            case '-':
            case '*':
            case '/':
                for(const c of cdr)
                    sub.push(compile_js(c, true));
                code = '';
                for (let i=0; i<cdr.length; i++) {
                    if (i > 0) 
                        code += ' ' + car + ' ';
                    code += '('+sub[i]+')';
                }
                break;
            case 'setq':
                code = 'locals["'+cdr[0]+'"] = ' + compile_js(cdr[1], true) + ';';
                break;
            case 'dotimes':
                // TODO: write loop var
                code = 'for (let _k=0; _k<' + compile_js(cdr[0][1], true) + '; _k++) {';
                for(const c of cdr.slice(1))
                    code += compile_js(c, true);
                code += '}';
                break;                
            default:
                code.push(car);
                for(const c of cdr)
                    code.push(compile_js(c));
                return code;
        }
    } 
    else {
        if (!processUnary)
            return sexpr;
        if (typeof(sexpr) === 'number')
            code = '' + sexpr;
        else
            code = 'locals["' + sexpr + '"]';
    }
    return code;
}

function compile(sexpr, processUnary=false) {
    let code = [];
    if (Array.isArray(sexpr)) {
        let car = sexpr[0];
        let cdr = sexpr.slice(1);
        // TODO: check, if child elements are compilable!
        switch (car) {
            case '+':
                code.push('_CODE');
                for(const c of cdr)
                    code.push(...compile(c, true).slice(1));
                code.push([INSTR_add, cdr.length]);
                break;
            case '-':
                code.push('_CODE');
                for(const c of cdr)
                    code.push(...compile(c, true).slice(1));
                code.push([INSTR_sub, cdr.length]);
                break
            case '*':
                code.push('_CODE');
                for(const c of cdr)
                    code.push(...compile(c, true).slice(1));
                code.push([INSTR_mul, cdr.length]);
                break;
            case '/':
                code.push('_CODE');
                for(const c of cdr)
                    code.push(...compile(c, true).slice(1));
                code.push([INSTR_div, cdr.length]);
                break;
            case 'setq':
                code.push('_CODE');
                code.push(...compile(cdr[1], true).slice(1));
                code.push([INSTR_store_sym, cdr[0]]);
                break;
            case 'dotimes':
                /*code.push('_CODE');
                code.push(...compile(cdr[0][1], true).slice(1));
                code.push([INSTR_loop, cdr[0][0], compile(cdr.slice(1), true)]);*/

                code.push('_CODE');
                // set counter variable to 0
                code.push([INSTR_push_const, 0]);
                code.push([INSTR_store_sym, cdr[0][0]]);
                // check if counter >= bound; then branch
                code.push([INSTR_push_sym, cdr[0][0]]);
                code.push([INSTR_push_sym, cdr[0][1]]);
                let branch_instr = [INSTR_branch_geq, 0];
                code.push(branch_instr);
                // loop body
                let n1 = code.length;
                for(const c of cdr.slice(1))
                    code.push(...compile(c, true).slice(1));
                let n2 = code.length;
                branch_instr[1] = n2-n1+2;
                // increment counter
                code.push([INSTR_inc_sym, cdr[0][0]]);
                // jump to next instruction
                code.push([INSTR_jump, n1-n2-5]);

                break;
            default:
                code.push(car);
                for(const c of cdr)
                    code.push(compile(c));
                return code;
        }
    } 
    else {
        if (!processUnary)
            return sexpr;
        if (typeof(sexpr) === 'number')
            code = ['_JS', [INSTR_push_const, sexpr]];
        else
            code = ['_JS', [INSTR_push_sym, sexpr]];
    }
    return code;
}

list = compile_js(list);
console.log(sexpr_toString(list) + '\n');


let functions = {};
let globals = {};

function eval(sexpr, locals={}) {
    if (Array.isArray(sexpr)) {
        let car = sexpr[0];
        let cdr = sexpr.slice(1);
        let id, sum, prod, n, y;
        let stack = [];
        switch (car) {
            case '_CODE':
                // TODO: manual stack management instead of using push+pop
                let pc = 0;
                let prog_size = cdr.length;
                while(pc < prog_size) {
                    const c = cdr[pc];

                    switch (c[0]) {
                        case INSTR_jump:
                            pc += c[1];
                            break;
                        case INSTR_branch_geq:
                            let o2 = stack.pop();
                            let o1 = stack.pop();
                            if (o1 >= o2)
                                pc += c[1]
                            break;
                        case INSTR_push_const:
                            stack.push(c[1]);
                            break;
                        case INSTR_inc_sym:
                            if (c[1] in locals)
                                locals[c[1]] = locals[c[1]] + 1;
                            else if (c[1] in globals)
                                globals[c[1]] = globals[c[1]] + 1;
                            else
                                assert.ok(false, 'unimplemented or error');
                            break;
                        case INSTR_push_sym:
                            if (c[1] in locals)
                                stack.push(locals[c[1]]);
                            else if (c[1] in globals)
                                stack.push(globals[c[1]]);
                            else
                                assert.ok(false, 'unimplemented or error');
                            break;
                        case INSTR_store_sym:
                            id = c[1];
                            let o = stack.pop();
                            // TODO: does not work in general
                            if (id in locals)
                                locals[id] = o;
                            else
                                globals[id] = o;
                            break;
                        case INSTR_add:
                            if(c[1] == 2) {
                                let o2 = stack.pop();
                                let o1 = stack.pop();
                                stack.push(o1 + o2);
                            } else
                                assert.ok(false, 'unimplemented');
                            break;
                        case INSTR_sub:
                            if(c[1] == 2) {
                                let o2 = stack.pop();
                                let o1 = stack.pop();
                                stack.push(o1 - o2);
                            } else
                                assert.ok(false, 'unimplemented');
                            break;
                        case INSTR_mul:
                            if(c[1] == 2) {
                                let o2 = stack.pop();
                                let o1 = stack.pop();
                                stack.push(o1 * o2);
                            } else
                                assert.ok(false, 'unimplemented');
                            break;
                        case INSTR_div:
                            if(c[1] == 2) {
                                let o2 = stack.pop();
                                let o1 = stack.pop();
                                stack.push(o1 / o2);
                            } else
                                assert.ok(false, 'unimplemented');
                            break;
                        /*case INSTR_loop:
                            n = stack.pop();
                            for(let k=0; k<n; k++) {
                                locals[c[1]] = k;
                                const m = c[2].length;
                                for(let i=0; k<m; k++) {
                                    //
                                }
                            }
                            break;*/
                        default:
                            assert.ok(false, 'unimplemented');
                    }

                    pc ++;
                }
            
                //for (const c of cdr) {  
                //}
                return stack.length==1 ? stack[0] : null;
            case '_PROG':
                for (const c of cdr)
                    eval(c);
                return null;
            case 'write':
                console.log(eval(cdr[0], locals));
                return null;
            case '+':
                sum = 0;
                for (const c of cdr)
                    sum += eval(c, locals);
                return sum;
            case '*':
                prod = 1;
                for (const c of cdr)
                    prod *= eval(c, locals);
                return prod;
            case '-':
                // TODO: test with 0, 1, 2, 3, ... args
                sum = 0;
                n = cdr.length;
                for (let i=0; i<n; i++) {
                    if (i == 1)
                        sum = -sum;
                    sum -= eval(cdr[i], locals);
                }
                return sum;
            case '/':
                // TODO: integer vs floating point
                // TODO: 0 args
                n = cdr.length;
                prod = eval(cdr[0], locals);
                if (n == 1)
                    return 1 / prod;
                else {
                    for (let i=1; i<n; i++)
                        prod /= eval(cdr[i], locals);
                    return prod;
                }
            case 'terpri':
                console.log('\n');
                return null;
            case 'defun':
                id = cdr[0];
                functions[id] = sexpr;
                return null;
            case 'defvar':
            case 'setq':
                id = cdr[0];
                // TODO: does not work in general
                if (id in locals)
                    locals[id] = eval(cdr[1], locals);
                else
                    globals[id] = eval(cdr[1], locals);
                return null;
            case 'let':
                for (const decl of cdr[0])
                    locals[decl[0]] = decl[1]; // TODO: scope!!
                y = null;
                for(const c of cdr.slice(1))
                    y = eval(c, locals);
                return y;
            case 'dotimes':
                n = eval(cdr[0][1], locals);
                for(let k=0; k<n; k++) {
                    locals[cdr[0][0]] = k;
                    y = null;
                    for(const c of cdr.slice(1))
                        y = eval(c, locals);
                }
                return y;
            default:
                if (car in functions) {
                    // call function
                    const fun = functions[car];
                    n = fun.length;
                    for (let i=0; i<fun[2].length; i++) {
                        locals[fun[2][i]] = cdr[i];
                    }
                    y = null;
                    for (let i=3; i<n; i++)
                        y = eval(fun[i], locals);
                    return y;
                } else {
                    let bp = 1337;
                }
                break;
        }
    } else {
        if (typeof(sexpr) === 'number')
            return sexpr;
        else if (sexpr in locals)
            return locals[sexpr];
        else if (sexpr in globals)
            return globals[sexpr];
        else {
            let bp = 1337;
        }
    }
}

eval(list);
