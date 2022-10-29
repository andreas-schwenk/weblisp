function approx_pi(n) {
    let pi = 0;
    let k = 1;
    for (let i=0; i<n; i++) {
        pi = pi + 1/k - 1/(k+2);
        k = k + 4;
    }
    return pi * 4;
}

console.log(approx_pi(10000000));
