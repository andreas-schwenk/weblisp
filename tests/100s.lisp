(equalp
    '(trs 'x 
        x -> y
        y -> z)
    '(rewrite 'x `x T `y `y T `z )   
)
