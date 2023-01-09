;; (equalp
;;     '(trs 'x 
;;         x -> y
;;         y -> z)
;;     '(rewrite 'x `x T `y `y T `z )   
;; )

(setf my-trs (trs
    x -> y
    y -> z))
(equalp 'z
    (rewrite 'x my-trs))
