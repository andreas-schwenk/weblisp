(setf input "int x = 4;")
(setf c #\0)   ; TODO: #\zero
(setf pos -1)

(defun next ()
    (setf pos (+ pos 1))
    (setf c (char input pos))
    c)

(write (next))
(write (next))
(write (next))
(write (next))
(equalp (next) #\x)
