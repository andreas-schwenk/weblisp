(setf k 100)
(equalp (+ 6 128 106)
    (do
        ((i 0 (+ i 1))(j 2 (* j 2)))
        ((> i 5) 1337 (+ i j k))
        (setf k (+ k 1))
    )
)
