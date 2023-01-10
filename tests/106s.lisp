; same as 106.lisp, with syntactic sugar:
; TRS-environment:
;   (trs {s "->" t})
; Uppercase identifiers are considered as variables.
; Type definitions in form
;   ":" type
; may follow.

; TODO: conditions

(setf diff-rules (trs
    (diff X:number V) -> 0
    (diff V V) -> 1
    (diff (+ X Y) V) -> (+ (diff X V) (diff Y V))
    (diff (+ X Y Z*) V) -> (+ (diff X V) (diff Y V) (diff (+ ~ Z) V))
    (diff (* X Y) V) -> (+ (* (diff X V) Y) (* X (diff Y V)))
    (diff (sin X) V) -> (* (diff X V) (cos X))
    (+ X:number Y:number) -> [+ X Y]
    (+ X:number Y:number Z*) -> (+ [+ X Y] ~ Z)
    (+ X 0) -> X
    (+ 0 X) -> X
    (* X:number Y:number) -> [* X Y]
    (* X:number Y:number Z*) -> (* [* X Y] ~ Z)
    (* X 0) -> 0
    (* 0 X) -> 0
    (* X 1) -> X
    (* 1 X) -> X
))

(assert (equalp 3
    (rewrite 
        '(diff 
            (+ 314 271 1337 (* 3 x)) 
            x) 
        diff-rules)) 
    "test 1 failed")

(assert (equalp '(+ x x)
    (rewrite 
        '(diff 
            (* x x) 
            x) 
        diff-rules)) 
    "test 2 failed")

(setf d (rewrite '(diff (sin (* 2 x)) x) diff-rules))
(assert (equalp d '(* 2 (COS (* 2 X)))) "test 3 failed")

T
