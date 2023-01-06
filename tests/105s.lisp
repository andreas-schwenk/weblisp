; same as 105.lisp, with syntactic sugar:
; TRS-environment:
;   (trs u {s "->" t})
; Uppercase identifiers are considered as variables.
; Type definitions in form
;   ":" type
; may follow.

; TODO: conditions

; TODO: "append" is ugly!

(setf d
    (TRS '(diff (+ 314 271 1337 (* 3 x)) x)
        (diff X:number V) -> 0
        (diff V V) -> 1
        (diff (+ X Y) V) -> (+ (diff X V) (diff Y V))
        (diff (+ X Y Z*) V) -> (+ (diff X V) (diff Y V) (diff [append '(+) Z] V))
        (diff (* X Y) V) -> (+ (* (diff X V) Y) (* X (diff Y V)))
        (+ X:number Y:number) -> [+ X Y]
        (+ X:number Y:number Z*) -> [append `(+ [+ X Y]) Z]
        (+ X 0) -> X
        (+ 0 X) -> X
        (* X 0) -> 0
        (* 0 X) -> 0
        (* X 1) -> X
        (* 1 X) -> X
))
(write d)
(equalp d 3)
