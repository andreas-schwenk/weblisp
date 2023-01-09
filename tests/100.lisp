; TRS
;; (equalp 'z
;;     (rewrite 'x
;;         'x T 'y
;;         'y T 'z))

(setf my-trs '(
    'x T 'y
    'y T 'z))
(write my-trs)
(equalp 'z 
    (rewrite 'x my-trs))
