(setf x
    (rewrite '(1 2 3 4 5)
        '(1 2 $$x) T x))

(write x)

(equalp x '(3 4 5))
