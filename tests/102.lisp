; TRS
(equalp 7
    (rewrite '(1 2 3)
        '(1 2 3)   T  '(4 5 6)
        '(4 5 $x)  T  x))

;(setf derivate 
;    (rules
;        (diff (+ $x $y) $v) -> (+ (diff x v) (diff y v) )
;        (diff (* $x $y) $v) -> (+ (* (diff x v) y) (* u (diff y v)) )
;        (diff $v $v) -> 1
;        (diff $u $v) [(not (equalp u v))] -> 0))
;(write
;    (rewrite (diff 1337) derivate))
; TODO: non-binary "+" and "*"
