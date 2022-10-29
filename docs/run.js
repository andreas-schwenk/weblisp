importScripts('weblisp.min.js');

const w = new weblisp.WebLISP();

onmessage = (e) => {
    let response = '';
    const w = new weblisp.WebLISP();
    //console.log(e.data);
    const src = e.data.src;
    try {
        w.import(src);
        w.run(e.data.maxRuntime);
        response = w.output.replace(/\n/g, '<br/>');;
    } catch(e) {
        response = 'error:' + e; 
    }
    postMessage(response);
}
