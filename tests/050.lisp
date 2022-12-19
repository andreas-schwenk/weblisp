(defun my-len (lst)
    (let ((len 0))
        (dolist (element lst)
            (setf len (+ len 1)))
    len))

(defun my-len-rec (lst)
    (if (null lst)
        0
        (+ 1 (my-len-rec (cdr lst)))))

(equalp 0
    (-
        (my-len-rec '(a b c d e))
        (my-len '(a b c d e))))

