(setf x
    (rewrite '(1 2 3 4 5)
        '(1 2 $$x) T `(a ~ ,x b ~ ,x)))

(write x)

(equalp x '(a 3 4 5 b 3 4 5))
