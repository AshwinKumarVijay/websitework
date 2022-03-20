//  Vertex Shader Source.
const copyVSSource = `

precision highp float;

attribute vec4 aVertexPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;


void main() {
    
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    
}

`;


//  Fragment Shader Source.
const copyFSSource = `

precision highp float;

uniform sampler2D uSourceTexture;

uniform vec2 uScreenResolution;

void main() {
    
    float pixelX = (gl_FragCoord.x / uScreenResolution.x);
    float pixelY = (gl_FragCoord.y / uScreenResolution.y);
    
    vec4 color = texture2D(uSourceTexture, vec2(pixelX, pixelY));
    
    gl_FragColor = vec4(color.xyz, 1.0);    
}


`;


var copyShaderSources = {

    "vertexShaderSource" : copyVSSource,
    "fragmentShaderSource" : copyFSSource

};
