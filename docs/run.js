importScripts("weblisp.min.js");

//const w = new weblisp.WebLISP(); // TODO: is this line needed??

onmessage = (e) => {
  let response = "";
  const w = new weblisp.WebLISP();
  //console.log(e.data);
  const src = e.data.src;
  const breakpoints = e.data.breakpoints;
  try {
    w.import(src);
    for (const b of breakpoints) {
      w.addBreakpoint(b + 1);
    }
    w.run(e.data.maxRuntime);
    response = w.output.replace(/\n/g, "<br/>");
    const d = w.getDebugInfo();
    for (const di of d) {
      response += "<br/>== BREAKPOINT " + di.breakpointLine + " ==<br/>";
      for (const vid in di.variableValues) {
        response += vid + ": " + di.variableValues[vid];
      }
    }
  } catch (e) {
    response = "error:" + e;
  }
  postMessage(response);
};
