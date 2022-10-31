# An interactive LISP Course

This course teaches the basics of LISP.
It is both an interactive course, as well as a reference manual.

> **Note** All examples executed in your browser at client side using [webLISP](https://github.com/andreas-schwenk/weblisp.git).

> **Warning** This document is work-in-progress.

## History

## Why should I learn LISP?

## Basics

Hello world:

```lisp
(print "hello, world!")
(terpri)
```

TODO: replace `lisp ... ` by an interactive playground

## S-Expressions

## Functions

factorial
$$n! = \prod_{k=1}^n k = 1 \cdot 2 \cdot ~\cdots~ \cdot (n-1) \cdot n$$

Recursive definition:
$$n! = (n-1)! \cdot n ~~~\text{with}~~~ 0!=1$$

With cases:
$$n! = \begin{cases}1 & \text{if } n\leq 1 \\ (n-1)! \cdot n & \text{otherwise }\end{cases}$$

```lisp
(defun fac (n)
    (if (<= n 1)
        1
        (* (fac (- n 1)) n)
    )
)

(write (fac 6))
```

<!--TODO: tail recursion-->

# Reference

- `car`
- `cdr`
- `cons`
- `cos`
- `exp`
- `list`
- `quote`
- `round`
- `sin`
- `terpri`
- `write`
- TODO
