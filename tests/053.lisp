(defun f (x y z) (* x y z))
(equalp 96 (funcall #'f 8 3 4))
