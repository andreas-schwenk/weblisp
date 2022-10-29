(defun approx_pi (n)
  (let ((p 0)(k 1))
    (dotimes (i n)
      (setq p (- (+ p (/ 1.0 k)) (/ 1.0 (+ k 2)) ))
      (setq k (+ k 4))
    )
    (* p 4)
  )
)

(write (approx_pi 1000))
(terpri)

; translate parts to fast interpretable code.
; e.g. "(setq k (+ k 4))" - > "(_CODE (push_local k) (push_const 4) (add 2) (store_local k) )"

; dotimes .. ->
;   i=0
;A: i>=n ? goto B
;   statements
;   i++
;   goto A
;B: 
