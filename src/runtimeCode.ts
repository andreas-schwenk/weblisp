// THIS FILE IS AUTO CREATED BY build.mjs
export const runtimeCode = `"use strict";var RUNTIME=(()=>{var m=Object.defineProperty;var l=Object.getOwnPropertyDescriptor;var h=Object.getOwnPropertyNames;var N=Object.prototype.hasOwnProperty;var I=(i,t)=>{for(var r in t)m(i,r,{get:t[r],enumerable:!0})},b=(i,t,r,e)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of h(t))!N.call(i,a)&&a!==r&&m(i,a,{get:()=>t[a],enumerable:!(e=l(t,a))||e.enumerable});return i};var f=i=>b(m({},"__esModule",{value:!0}),i);var L={};I(L,{Ratio:()=>o,SExpr:()=>n,SExprType:()=>d});var d=(c=>(c.CONS="CONS",c.NIL="NIL",c.INT="INT",c.RATIO="RATIO",c.FLOAT="FLOAT",c.ID="ID",c.STR="STR",c.T="T",c.DEFUN="DEFUN",c.GLOBAL="GLOBAL",c))(d||{});function p(i,t){for(;t!=0;){let r=t;t=i%t,i=r}return i}var o=class{constructor(t,r){this.numerator=t,this.denominator=r,this.reduce()}clone(){return new o(this.numerator,this.denominator)}reduce(){let t=p(this.numerator,this.denominator);this.numerator/=t,this.denominator/=t}compare(t){let r=this.clone();r.reduce();let e=t.clone();return e.reduce(),r.numerator==e.numerator&&r.denominator==e.denominator}static fromNumber(t){return new o(t,1)}static add(t,r){let e=new o(t.numerator*r.denominator+r.numerator*t.denominator,t.denominator*r.denominator);return e.reduce(),e}static sub(t,r){let e=new o(t.numerator*r.denominator-r.numerator*t.denominator,t.denominator*r.denominator);return e.reduce(),e}static mul(t,r){let e=new o(t.numerator*r.numerator,t.denominator*r.denominator);return e.reduce(),e}static div(t,r){let e=new o(t.numerator*r.denominator,t.denominator*r.numerator);return e.reduce(),e}toFloat(){return this.numerator/this.denominator}toString(){return""+this.numerator+"/"+this.denominator}};var n=class{constructor(t,r=-1,e=-1){this.car=null;this.cdr=null;this.srcRow=-1;this.srcCol=-1;this.type=t,this.srcRow=r,this.srcCol=e}set(t){this.type=t.type,this.data=t.data,this.car=t.car,this.cdr=t.cdr,this.srcRow=t.srcRow,this.srcCol=t.srcCol}static cons(t,r,e=-1,a=-1){let s=new n("CONS",e,a);return s.car=t,s.cdr=r,s}static defun(t,r,e=-1,a=-1){let s=new n("DEFUN",e,a);return s.car=n.atomID(t),s.cdr=r,s}static global(t,r=-1,e=-1){let a=new n("GLOBAL",r,e);return a.data=t,a}static atomNIL(t=-1,r=-1){return new n("NIL",t,r)}static atomINT(t,r=-1,e=-1){let a=new n("INT",r,e);return a.data=t,a}static atomRATIO(t,r,e=-1,a=-1){let s=new n("RATIO",e,a);return s.data=new o(t,r),s}static atomFLOAT(t,r=-1,e=-1){let a=new n("FLOAT",r,e);return a.data=t,a}static atomID(t,r=-1,e=-1){let a=new n("ID",r,e);return a.data=t,a}static atomSTRING(t,r=-1,e=-1){let a=new n("STR",r,e);return a.data=t,a}static atomT(t=-1,r=-1){return new n("T",t,r)}static len(t){let r=0;for(;t.type!=="NIL";)t=t.cdr,r++;return r}static nthcdr(t,r){let e=0;for(;t.type!=="NIL";){if(e==r)return t;t=t.cdr,e++}return n.atomNIL()}static nth(t,r){let e=0;for(;t.type!=="NIL";){if(e==r)return t.car;t=t.cdr,e++}return n.atomNIL()}static deepNth(t,r){let e=n.atomNIL();for(let a=0;a<r.length&&t.type!=="NIL";a++)e=t=n.nth(t,r[a]);return e}static equalp(t,r){if(t.type!==r.type)return!1;switch(t.type){case"CONS":if(n.equalp(t.car,r.car)==!1||n.equalp(t.cdr,r.cdr)==!1)return!1;break;case"INT":if(t.data!==r.data)return!1;break;case"FLOAT":let e=t.data,a=r.data;if(Math.abs(e-a)>1e-12)return!1;break;case"RATIO":if(t.data.compare(r.data)==!1)return!1;break;case"ID":case"STR":if(t.data!==r.data)return!1;break}return!0}remove(t){let r,e;r=n.atomNIL();let a=this,s=0;for(;a.type!=="NIL";){let u=a.car;u.type!=="CONS"&&u.type===t.type&&u.data===t.data||(s==0?r=e=n.cons(u,n.atomNIL()):(e.cdr=n.cons(u,n.atomNIL()),e=e.cdr)),a=a.cdr,s++}return r}static subst(t,r,e){return r.type==="CONS"?e:r.type===e.type&&r.data===e.data?t:e.type==="CONS"?n.cons(n.subst(t,r,e.car),n.subst(t,r,e.cdr)):e}toFloat(){switch(this.type){case"INT":case"FLOAT":return this.data;case"RATIO":return this.data.toFloat();default:return 0}}toCode(){switch(this.type){case"T":return"SExpr.atomT()";case"NIL":return"SExpr.atomNIL()";case"INT":case"FLOAT":return"SExpr.atomINT("+this.data+")";case"RATIO":return"SExpr.atomRATIO("+this.data.numerator+","+this.data.denominator+")";case"CONS":return"SExpr.cons("+this.car.toCode()+","+this.cdr.toCode()+")";default:throw Error("unimplemented SExpr.toCode() for type "+this.type)}}toString(){switch(this.type){case"NIL":return"NIL";case"T":return"T";case"INT":return""+this.data;case"FLOAT":return""+this.data;case"RATIO":return""+this.data.toString();case"ID":case"STR":case"GLOBAL":return this.data;case"DEFUN":return"FUNCTION "+this.car.data;case"CONS":let t="(",r=this,e=0;do{if(r.type==="NIL")break;if(e>0&&(t+=" "),r.type!="CONS"){t+=". "+r.toString();break}t+=r.car.toString(),r=r.cdr,e++}while(r!=null);return t+=")",t;default:throw new Error("unimplemented")}}};return f(L);})();
`;
