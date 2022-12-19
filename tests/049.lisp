(setf l '(10 20 30 40 50))
(setf n 0)
(setf sum 0)
(dolist (li l)
    (setf n (+ n 1))
    (setf sum (+ sum li)))
(equalp T
    (and
        (equalp sum 150)
        (equalp n (length l))))

