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
let t = s.toString();
assert.ok(t === exp);

exp = "21";
s = SExpr.fromString(exp);
t = s.toString();
assert.ok(t === exp);

exp = "(1 . 2)";
s = SExpr.fromString(exp);
t = s.toString();
assert.ok(t === exp);

// TODO: test if error occurs for "(1 . 2 3)"

s = SExpr.fromString("(1 . (2 3))");
t = s.toString();
assert.ok(t === "(1 2 3)");

// TODO
/*
exp = "21 31";
s = SExpr.fromString(exp);
assert.ok(s.toString() === exp);
*/