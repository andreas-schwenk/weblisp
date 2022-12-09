(let ((x 1))
    (defparameter *global* 1337)
)
(equalp *global* 1337)
