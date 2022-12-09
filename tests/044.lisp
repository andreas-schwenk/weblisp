(setf x '(1337 314 (271 314) 5))
(setf y (remove 314 x))
; list is a copy; elements of x and y are stored in SAME place
(setf (car (third x)) 4711)
(equalp y '(1337 (4711 314) 5))
