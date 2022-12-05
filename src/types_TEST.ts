import * as assert from "assert";

import { Ratio } from "./types";

assert.ok(new Ratio(2, 4).compare(new Ratio(1, 2)));
assert.ok(new Ratio(-2, 6).compare(new Ratio(1, -3)));
assert.ok(
  Ratio.add(new Ratio(-2, 3), new Ratio(4, -5)).compare(new Ratio(-22, 15))
);
assert.ok(
  Ratio.sub(new Ratio(-2, 3), new Ratio(4, -5)).compare(new Ratio(2, 15))
);
assert.ok(
  Ratio.mul(new Ratio(-2, 3), new Ratio(4, -5)).compare(new Ratio(8, 15))
);
assert.ok(
  Ratio.div(new Ratio(-2, 3), new Ratio(4, -5)).compare(new Ratio(5, 6))
);
