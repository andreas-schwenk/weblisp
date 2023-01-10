(defun f (x y z) (* x y z))
(write (function f))
; (write #'f)
(equalp 96 (apply #'f '(8 3 4)))
