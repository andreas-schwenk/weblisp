; TRS
(setf d
    (rewrite '(diff (+ 1337 (* 3 x)) x)
        '(diff $x $v)
            (numberp x)
            0
        '(diff $x $v)      
            (equalp x v)
            1
        '(diff (+ $x $y) $v)
            T
            `(+ (diff ,x ,v) (diff ,y ,v))
        '(diff (* $x $y) $v)
            T
            `(+ (* (diff ,x ,v) ,y) (* ,x (diff ,y ,v)))
        '(+ $x $y)      
            (and (numberp x) (numberp y))   
            (+ x y)
        '(+ $x 0) T x
        '(+ 0 $x) T x
        '(* $x 0) T 0
        '(* 0 $x) T 0
        '(* $x 1) T x
        '(* 1 $x) T x
    ))
(write d)
(equalp d 3)
