(write (+ 2 3))
(terpri)          ; linefeed

(defvar x 1337)   ; global variable
(write x)
(terpri)

(setq x 314)      ; x := 314
(write x)
(terpri)

(defun f (x y z w)
  (+ x (* y z w))
)
(write (f 3 4 5 6))
(terpri)

(write x)
(terpri)

(setq xx 271)     ; setq also creates global variables
(write xx)
(terpri)
