(defun test ()
    (setq a 7)
    (let ((a 1)(b 5))
        (setq a 2)
        (let ((a 1337))
            (write a)
            (terpri)    
        )
        (write a)
        (terpri)
    )
    (write a)
    (terpri)
)
(test)