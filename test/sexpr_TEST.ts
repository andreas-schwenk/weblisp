/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

import * as assert from "assert";

import { SExpr } from "../src/sexpr";

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
assert.ok(s.toString() === exp);

// match() tests

// pattern := (3 $X)
let pattern = SExpr.cons(
  SExpr.atomINT(3),
  SExpr.cons(
    SExpr.atomID("$X"), //
    SExpr.atomNIL()
  )
);
// s := (3 (4 5))
s = SExpr.cons(
  SExpr.atomINT(3), //
  SExpr.cons(
    SExpr.cons(
      SExpr.atomINT(4), //
      SExpr.cons(
        SExpr.atomINT(5), //
        SExpr.atomNIL()
      )
    ),
    SExpr.atomNIL()
  )
);
let vars: { [id: string]: SExpr } = {};
assert.ok(SExpr.match(pattern, s, vars));
assert.ok(Object.keys(vars).length == 1);
assert.ok("X" in vars);
assert.ok(vars["X"].toString() === "(4 5)");

// pattern := (3 $X $X)
pattern = SExpr.cons(
  SExpr.atomINT(3),
  SExpr.cons(
    SExpr.atomID("$X"), //
    SExpr.cons(
      SExpr.atomID("$X"), //
      SExpr.atomNIL()
    )
  )
);
// s := (3 (4 5) (4 5))
s = SExpr.cons(
  SExpr.atomINT(3), //
  SExpr.cons(
    SExpr.cons(
      SExpr.atomINT(4), //
      SExpr.cons(
        SExpr.atomINT(5), //
        SExpr.atomNIL()
      )
    ),
    SExpr.cons(
      SExpr.cons(
        SExpr.atomINT(4), //
        SExpr.cons(
          SExpr.atomINT(5), //
          SExpr.atomNIL()
        )
      ),
      SExpr.atomNIL()
    )
  )
);
vars = {};
assert.ok(SExpr.match(pattern, s, vars));
assert.ok(Object.keys(vars).length == 1);
assert.ok("X" in vars);
assert.ok(vars["X"].toString() === "(4 5)");

// pattern := (3 $X $X)
//   same as above
// s := (3 (4 5) (4 333))
s = SExpr.cons(
  SExpr.atomINT(3), //
  SExpr.cons(
    SExpr.cons(
      SExpr.atomINT(4), //
      SExpr.cons(
        SExpr.atomINT(5), //
        SExpr.atomNIL()
      )
    ),
    SExpr.cons(
      SExpr.cons(
        SExpr.atomINT(4), //
        SExpr.cons(
          SExpr.atomINT(333), //
          SExpr.atomNIL()
        )
      ),
      SExpr.atomNIL()
    )
  )
);
vars = {};
assert.ok(SExpr.match(pattern, s, vars) == false);

// pattern := (3 $$x)
pattern = SExpr.cons(
  SExpr.atomINT(3),
  SExpr.cons(
    SExpr.atomID("$$X"), //
    SExpr.atomNIL()
  )
);
// s := (3 4 5)
s = SExpr.cons(
  SExpr.atomINT(3), //
  SExpr.cons(
    SExpr.atomINT(4), //
    SExpr.cons(
      SExpr.atomINT(5), //
      SExpr.atomNIL()
    )
  )
);
vars = {};
assert.ok(SExpr.match(pattern, s, vars));
assert.ok(Object.keys(vars).length == 1);
assert.ok("X" in vars);
assert.ok(vars["X"].toString() === "(4 5)");

// pattern := (3 $$x)
// (unchanged)
// s := (3 4)
s = SExpr.cons(
  SExpr.atomINT(3), //
  SExpr.cons(
    SExpr.atomINT(4), //
    SExpr.atomNIL()
  )
);
vars = {};
assert.ok(SExpr.match(pattern, s, vars));
assert.ok(Object.keys(vars).length == 1);
assert.ok("X" in vars);
assert.ok(vars["X"].toString() === "(4)");

// pattern := (3 $$x)
// (unchanged)
// s := (3)
s = SExpr.cons(
  SExpr.atomINT(3), //
  SExpr.atomNIL()
);
vars = {};
assert.ok(SExpr.match(pattern, s, vars));
assert.ok(Object.keys(vars).length == 1);
assert.ok("X" in vars);
assert.ok(vars["X"].toString() === "NIL");

// TODO: test with $$x $$x twice

// TODO: test SExpr.clone(), ...
