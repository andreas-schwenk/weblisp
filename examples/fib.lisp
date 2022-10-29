;(setq numcalls 0)

(defun fib (n)
  ; (setq numcalls (+ numcalls 1))
  (if (< n 2)
      n
      (+ (fib (- n 1))
         (fib (- n 2)))))

(write (fib 120))
(terpri)

;(write numcalls)
;(terpri)
