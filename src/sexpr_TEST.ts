const assert = require("assert");

const { SExpr } = require("./sexpr");

// toString() tests

let exp = "(3 4)";
let s = SExpr.cons(SExpr.atomINT(3), SExpr.cons(SExpr.atomINT(4), null));
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
            null
          )
        )
      ),
      SExpr.cons(
        SExpr.atomINT(5), //
        null
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
s = SExpr.cons(null, null);
assert.ok(s.toString() === exp);

exp = "(NIL . 4)";
s = SExpr.cons(null, SExpr.atomINT(4));
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

// parse(..) tests

exp = "(* 21 (+ 31 41) 51)";
s = SExpr.fromString(exp);
assert.ok(s.length == 1);
let t = s.toString();
assert.ok(t === exp);

exp = "21";
s = SExpr.fromString(exp);
assert.ok(s.length == 1);
t = s.toString();
assert.ok(t === exp);

exp = "(1 . 2)";
s = SExpr.fromString(exp);
assert.ok(s.length == 1);
t = s.toString();
assert.ok(t === exp);

exp = "(1 . 2 3)";
try {
  s = SExpr.fromString(exp);
  assert.ok(false);
} catch (e) {
  assert.ok(true);
}

s = SExpr.fromString("(1 . (2 3))");
assert.ok(s.length == 1);
t = s.toString();
assert.ok(t === "(1 2 3)");

// TODO
exp = "5 (* 3 4)";
s = SExpr.fromString(exp);
assert.ok(s.length == 2);
t = s[0].toString() + " " + s[1].toString();
assert.ok(t === exp);

s = SExpr.fromString(`
(* (+ 2 3) ; comment
    4)
`);
assert.ok(s.length == 1);
t = s.toString();
assert.ok(t === "(* (+ 2 3) 4)");

s = SExpr.fromString("(>= a b)");
assert.ok(s.length == 1);
t = s.toString();
assert.ok(t === exp);
