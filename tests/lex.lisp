; TOKEN = { WS } ( KW | ID | INT | DEL );
; KW = "int" | "if" | "for" | "while";
; ID = ALPHA { ALPHA | NUM };
; INT = "0" | NUM1 { NUM };
; DEL = "=" | ";";
; ALPHA = "a".."z" | "A".."Z" | "_";
; NUM = "0..9";
; ALPHA_NUM = ALPHA | NUM;
; NUM1 = "1..9";
; WS = "\n" | " " | "\t";

; example input string:
; "int x = 4;" -> 
;   (kw "int")
;   (id "x")
;   (del "=")
;   (int "4")
;   (ter ";")

(setf input "int x = 4;")
(setf pos -1)

(defun next ()
    (setf pos (+ pos 1))
    (char input pos))

(setf lex-rules (trs
    (start TK #\i) -> (id-i "i" (next))
    (id-i TK #\f) -> (kw "if")
    (id-i TK #\n) -> (id-in "in" (next))
    (id-in TK #\t) -> (kw "int")
))

(write
    (rewrite '(start "" #\0) lex-rules))

T ; TODO
