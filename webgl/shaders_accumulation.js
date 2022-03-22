//  Vertex Shader Source.
const accumulationVSSource = 
commonShaderVersionSource + 
`

precision highp float;

in vec4 aVertexPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;


void main() {
    
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    
}

`;



//  Fragment Shader Source.
const accumulationFSSource = 
commonShaderVersionSource + 
`

precision highp float;

uniform sampler2D uSourceTexture;
uniform sampler2D uCurrentAccTexture;

uniform float uFrameCount;
uniform vec2 uScreenResolution;

out vec4 fragColor;

void main() {
    
    float pixelX = (gl_FragCoord.x / uScreenResolution.x);
    float pixelY = (gl_FragCoord.y / uScreenResolution.y);
    
    //  
    vec4 pathTracerTextureSample = texture2D(uTextureSamplerA, vec2(pixelX, pixelY));
    vec4 currentInputTextureSample = texture2D(uTextureSamplerB, vec2(pixelX, pixelY));
    
    vec3 weightedColor = vec3(0.0, 0.0, 0.0);
    
    vec3 maxColor = vec3(1.0, 1.0, 0.0);
    float maxValue = 1000.0;
    
    if(uFrameCount < maxValue) {
        //  
        weightedColor = (pathTracerTextureSample.xyz / maxValue) + currentInputTextureSample.xyz;    
    }
    else {
        weightedColor = currentInputTextureSample.xyz;
    }
    
    //  
    fragColor = vec4(weightedColor.xyz, 1.0);
}

`;
