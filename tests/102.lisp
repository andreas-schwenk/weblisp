; TRS
(setf v
    (rewrite '(1 2 3)
        '(1 2 3)   T  '(4 5 6)
        '(4 5 $x)  T  x))
(write v)
(equalp v 6)
