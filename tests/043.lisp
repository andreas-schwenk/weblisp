(setf x '(10 20 30))
(setf (car x) '1337)
(equalp x '(1337 20 30))
