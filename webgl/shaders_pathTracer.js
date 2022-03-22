//  Vertex Shader Source.
const pathTracerVSSource = 
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
const pathTracerFSSource = 
commonShaderVersionSource + 

`

precision highp float;

#define volumedensity 50.0

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

uniform mat4 uInverseProjectionMatrix;
uniform vec2 uScreenResolution;

uniform float uRandomSeed;

out vec4 fragColor;

`

+ noiseFunctionShaderSource + 

`

struct Ray {
    vec3 origin;            //  Origin.
    vec3 direction;         //  Direction.
};


struct CurrentRayPathData {

    float stepSize;
    bool didIntersectObject;

};



// 4D Julia set Distance Estimator (With an Orbit Trap)
vec4 qsqr(vec4 a){
    return vec4(a.x*a.x-a.y*a.y-a.z*a.z-a.w*a.w, 2.0*a.x*a.y, 2.0*a.x*a.z, 2.0*a.x*a.w);
}

vec4 distanceestimator(vec3 pos){

    vec4 z = vec4(pos, 0.0);
    float md2 = 1.0;
    float mz2 = dot(z, z);
    vec4 orbitTrap = vec4(1.0);
    for(int i = 0; i < 8; i++){
        md2 *= 4.0*mz2;
        z = qsqr(z)+vec4(-0.5, 0.35, 0.5, 0.0);
        //z = qsqr(z)+vec4(-0.5, 0.5, 0.25, 0.0);
        orbitTrap = min(abs(z), orbitTrap);
        mz2 = dot(z,z);
        if(mz2 > 4.0) break;}
    float sdf = 0.25*sqrt(mz2/md2)*log(mz2);
    return vec4(orbitTrap.rgb, sdf);}

// 3D Volumetric Density Function
vec4 densityfunction(vec3 pathposition){

    float density = 0.0;
    vec4 distanceestimation = distanceestimator(pathposition);
    if(distanceestimation.w < 0.0){density = volumedensity;}
    return vec4(distanceestimation.rgb, density);
}




vec3 traceRay(float seed) {
    
    //  Compute the Current NDC X and Y.
    float pixelX = (gl_FragCoord.x * 2.0 / uScreenResolution.x) - 1.0;
    float pixelY = (gl_FragCoord.y * 2.0 / uScreenResolution.y) - 1.0;
    
    //  Construct the Vector for the the Current NDC Coordinates.
    vec4 pixelCoordinates = vec4(pixelX, pixelY, 0.0, 1.0);  
    
    //  Unproject the Pixel Coordinates.       
    vec4 unprojectedPixelCoordinates = normalize(uInverseProjectionMatrix * pixelCoordinates);
    
    //  Construct the Current Ray.
    vec3 currentRayDirection = unprojectedPixelCoordinates.xyz / unprojectedPixelCoordinates.w;
    currentRayDirection = normalize(currentRayDirection);
    
    
    //  ----------   //
    //  Get the Origin.
    vec3 origin = vec3(0.0, 0.0, 2.0);
    
    //  The Output Color of the Ray.
    vec3 outputColor = vec3(0.0);    
    
    //  The Accumulated Color of the Bounces.
    vec3 accumulatedColor = vec3(0.0);

    //  The Attrition Mask.
    vec3 attritionMask = vec3(1.0, 1.0, 1.0);
    
    //  Set the Light Position.
    vec3 lightPosition = vec3(0.0, 0.0, 0.0);
    

    //  
    Ray currentRayMarch;
    currentRayMarch.origin = origin;
    currentRayMarch.direction = currentRayDirection;

    //  
    float stepSize = 0.1;
    bool didIntersectObject = false;


    for(int currentStepCount = 0; currentStepCount < 128; currentStepCount++) {

        //  Get the Current Position.
        currentRayMarch.origin = currentRayMarch.origin + stepSize * currentRayMarch.direction;
        
        //  Get the Current Distance Estimation and the Density.
        vec4 currentDistanceEstimation = densityfunction(currentRayMarch.origin);

        //  Get the Absorbance.
        float absorbance = exp(-currentDistanceEstimation.w * stepSize);

        //  Get the Random Value.
        float randValue = rand();

        //  
        if(absorbance < randValue) {

            attritionMask *= clamp(currentDistanceEstimation.rgb * 1.0, vec3(0.0), vec3(1.0));
            break;
            
            currentRayMarch.direction = normalize(nrand3(1.0, vec3(0.0)));
            currentRayMarch.origin = currentRayMarch.origin + stepSize * currentRayMarch.direction;
            
        } 

    }


    return vec3(243.0 / 255.0, 243.0 / 255.0, 243.0 / 255.0) * attritionMask;
}


void main() {
    
    INIT_RNG;
    
    //  Zero!
    vec3 accumulatedColor = vec3(0.0);
    
    //  Accumlate The Color From the Traced Ray.
    accumulatedColor = accumulatedColor + traceRay(uRandomSeed);
    
    //  Output Color!
    fragColor = vec4(accumulatedColor, 1.0);
}

`;



var pathTracerShaderSources = {

    "vertexShaderSource" : pathTracerVSSource,
    "fragmentShaderSource" : pathTracerFSSource

};
