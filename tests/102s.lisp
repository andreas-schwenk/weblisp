(setf v
    (trs '(1 2 3)
        (1 2 3) -> (4 5 6)
        (4 5 X) -> X))
(equalp v 6)
