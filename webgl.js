//  Main WebGL.


//  Initialize the GLRenderer to Nil.
var glRenderer = null;

//  
var previousTimeInSeconds = 0.0;


//  Main!
main();


//
//
function main() {

    //  Get the canvas.
    const canvas = document.querySelector('#glcanvas');

    // Initialize the GL context
    const gl = canvas.getContext('webgl2');

    

    //  Check if we have a GL Context.
    if (!gl) {

      alert('Unable to initialize WebGL.');
      return;
    
    }

    //  Fixed it to 1600, 900 for the moment.
    glRenderer = new GLRenderer(gl);
    
    //  Request Animation Frame.
    requestAnimationFrame(render);    
}

//  
function render(currentTime) {

    //  Compute the Current Time in Seconds.
    var currentTimeInSeconds = currentTime * 0.001;
    
    //  Delta Time in Seconds.
    var deltaTimeInSeconds = currentTimeInSeconds - previousTimeInSeconds;

    //  Current Time In Seconds.
    previousTimeInSeconds = currentTimeInSeconds;

    //  Draw!
    glRenderer.draw(deltaTimeInSeconds, currentTimeInSeconds, previousTimeInSeconds);

    //  Request Animation Frame.
    requestAnimationFrame(render);
}

