class Cons {
  constructor(car = null, cdr = null) {
    this.car = car;
    this.cdr = cdr;
  }
  toString() {
    const a = this.car == null ? "NIL" : this.car.toString();
    const b = this.cdr == null ? "NIL" : this.cdr.toString();
    return "(" + a + " . " + b + ")";
  }
}

let c = new Cons(1, new Cons(2, new Cons(3, null)));
console.log(c.toString());

/* TODO:
Break 24 [27]> (cons '* (cons 2 (cons (cons '+ (cons 3 (cons 4 nil))) (cons 5 nil) ) ))
(* 2 (+ 3 4) 5)
*/
