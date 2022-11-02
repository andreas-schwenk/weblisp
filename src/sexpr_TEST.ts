/* webLISP, 2022 by Andreas Schwenk */

import * as assert from "assert";

import { SExpr } from "./sexpr";

// toString() tests

let exp = "(3 4)";
let s = SExpr.cons(
  SExpr.atomINT(3),
  SExpr.cons(
    SExpr.atomINT(4), //
    SExpr.atomNIL()
  )
);
assert.ok(s.toString() === exp);

exp = "(* 2 (+ 3 4) 5)";
s = SExpr.cons(
  SExpr.atomID("*"),
  SExpr.cons(
    SExpr.atomINT(2),
    SExpr.cons(
      SExpr.cons(
        SExpr.atomID("+"),
        SExpr.cons(
          SExpr.atomINT(3), //
          SExpr.cons(
            SExpr.atomINT(4), //
            SExpr.atomNIL()
          )
        )
      ),
      SExpr.cons(
        SExpr.atomINT(5), //
        SExpr.atomNIL()
      )
    )
  )
);
assert.ok(s.toString() === exp);

exp = "(3 . 4)";
s = SExpr.cons(
  SExpr.atomINT(3), //
  SExpr.atomINT(4)
);
assert.ok(s.toString() === exp);

exp = "(NIL)";
s = SExpr.cons(SExpr.atomNIL(), SExpr.atomNIL());
assert.ok(s.toString() === exp);

exp = "(NIL . 4)";
s = SExpr.cons(SExpr.atomNIL(), SExpr.atomINT(4));
assert.ok(s.toString() === exp);

exp = "(3 3 . 4)";
s = SExpr.cons(
  SExpr.atomINT(3),
  SExpr.cons(
    SExpr.atomINT(3), //
    SExpr.atomINT(4)
  )
);
const test = s.toString();
assert.ok(s.toString() === exp);
