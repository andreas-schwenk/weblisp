(equalp 'z
    (rewrite 'x (trs
        x            -> y
        [car '(y w)] -> z)))
