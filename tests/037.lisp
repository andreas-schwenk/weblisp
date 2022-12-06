(defun fac (n)
    (if (equalp n 0)
        1
        (* n (fac (- n 1))))
)
(equalp 6
    (fac 3))
