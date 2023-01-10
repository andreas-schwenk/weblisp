
; code optimization

(setf code ; x = 2 * 3;
    '(store-int x (* (const-int 2) (const-int 3))))

(setf code-opt-rules (trs
    (* (const-int X) (const-int Y)) -> (const-int [* X Y])
))

(write
    (rewrite code code-opt-rules))

T ; TODO
