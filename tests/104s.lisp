(setf x
    (rewrite '(1 2 3 4 5) (trs
        (1 2 X*) -> X)))
(equalp x '(3 4 5))
