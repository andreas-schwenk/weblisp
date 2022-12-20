(equalp 
    '(y (x z))
    (substitute 'y 'x '(x (x z))))
