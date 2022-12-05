/* webLISP, 2022 by Andreas Schwenk */

export enum SExprType {
  CONS = "CONS", // car, cdr
  NIL = "NIL", // atom
  INT = "INT", // atom
  RATIO = "RATIO", // atom
  FLOAT = "FLOAT", // atom
  ID = "ID", // atom
  STR = "STR", // atom
  T = "T", // atom
}

function gcd(x: number, y: number): number {
  while (y != 0) {
    let t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export class Ratio {
  numerator: number;
  denominator: number;

  constructor(numerator: number, denominator: number) {
    this.numerator = numerator;
    this.denominator = denominator;
    this.reduce();
  }

  clone(): Ratio {
    return new Ratio(this.numerator, this.denominator);
  }

  reduce(): void {
    const d = gcd(this.numerator, this.denominator);
    this.numerator /= d;
    this.denominator /= d;
  }

  compare(r: Ratio): boolean {
    const r1 = this.clone();
    r1.reduce();
    const r2 = r.clone();
    r2.reduce();
    return r1.numerator == r2.numerator && r1.denominator == r2.denominator;
  }

  static fromNumber(n: number): Ratio {
    const r = new Ratio(n, 1);
    return r;
  }

  static add(u: Ratio, v: Ratio): Ratio {
    const sum = new Ratio(
      u.numerator * v.denominator + v.numerator * u.denominator,
      u.denominator * v.denominator
    );
    sum.reduce();
    return sum;
  }

  static sub(u: Ratio, v: Ratio): Ratio {
    const diff = new Ratio(
      u.numerator * v.denominator - v.numerator * u.denominator,
      u.denominator * v.denominator
    );
    diff.reduce();
    return diff;
  }

  static mul(u: Ratio, v: Ratio): Ratio {
    const prod = new Ratio(
      u.numerator * v.numerator,
      u.denominator * v.denominator
    );
    prod.reduce();
    return prod;
  }

  static div(u: Ratio, v: Ratio): Ratio {
    const quot = new Ratio(
      u.numerator * v.denominator,
      u.denominator * v.numerator
    );
    quot.reduce();
    return quot;
  }

  toFloat(): number {
    return this.numerator / this.denominator;
  }

  toString(): string {
    return "" + this.numerator + "/" + this.denominator;
  }
}
