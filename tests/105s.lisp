(setf x
    (rewrite '(1 2 3 4 5) (trs
        (1 2 X*) -> (a ~ X b ~ X))))

(equalp x '(a 3 4 5 b 3 4 5))
