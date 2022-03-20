


//  Vertex Shader Source.
const pathTracerVSSource = `

precision highp float;

attribute vec4 aVertexPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

void main() {
    
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    
}            

`;

//  Fragment Shader Source.
const pathTracerFSSource = `

precision highp float;


uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

uniform mat4 uInverseProjectionMatrix;
uniform vec2 uScreenResolution;

uniform float uRandomSeed;


float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
    
    vec3 tMin = (cubeMin - origin) / ray;
    vec3 tMax = (cubeMax - origin) / ray;
    vec3 t1 = min(tMin, tMax);   
    vec3 t2 = max(tMin, tMax);   
    
    float tNear = max(max(t1.x, t1.y), t1.z);   
    float tFar = min(min(t2.x, t2.y), t2.z);   
    
    return vec2(tNear, tFar); 
    
} 

vec3 normalForCube(vec3 hit, vec3 cubeMin, vec3 cubeMax) 
{   
    
    if(hit.x < cubeMin.x + 0.0001){
        return vec3(-1.0, 0.0, 0.0);
    }
    else if(hit.x > cubeMax.x - 0.0001) {
        return vec3(1.0, 0.0, 0.0);
    }
    else if(hit.y < cubeMin.y + 0.0001) {
        return vec3(0.0, -1.0, 0.0);   
    }
    else if(hit.y > cubeMax.y - 0.0001) {
        return vec3(0.0, 1.0, 0.0);   
    }
    else if(hit.z < cubeMin.z + 0.0001) {
        return vec3(0.0, 0.0, -1.0);
    }
    else {
        return vec3(0.0, 0.0, 1.0); 
    }
} 


vec3 cosineWeightedDirection(float seed, vec3 normal) 
{   
    float u = random(vec3(12.9898, 78.233, 151.7182), seed);
    float v = random(vec3(63.7264, 10.873, 623.6736), seed);
    
    float r = sqrt(u);
    
    float angle = 6.283185307179586 * v;   
    
    vec3 sdir, tdir;   
    
    if (abs(normal.x)<.5) 
    {
        sdir = cross(normal, vec3(1,0,0));   
    } 
    else 
    {     
        sdir = cross(normal, vec3(0,1,0));   
    }   
    
    tdir = cross(normal, sdir);
    
    return r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1.-u) * normal;
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
    vec3 currentRay = unprojectedPixelCoordinates.xyz / unprojectedPixelCoordinates.w;
    currentRay = normalize(currentRay);
    
    
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
    for(int bounce = 0; bounce < 5; bounce++) 
    {
        //  
        float t = 10000.0;     
        
        //  Make the Room Cube Min and Max.
        vec3 roomCubeMin = vec3(-1.0, -1.0, -1.0);
        vec3 roomCubeMax = vec3( 1.0,  1.0, 1.0);
        
        //  
        vec2 tRoom = intersectCube(origin, currentRay.xyz, roomCubeMin, roomCubeMax);
        
        if(tRoom.x < tRoom.y) {
            t = tRoom.y;
        }    
        
        //  Construct the Hitpoint.
        vec3 hitPoint = origin + currentRay.xyz * t;     
        
        //                          
        if(t == tRoom.y) 
        {
            //  Default is Black.
            vec3 surfaceColor = vec3(0.0, 0.0, 0.0);
            
            //  Compute the Normal of the Cube.
            vec3 normal = -normalForCube(hitPoint, roomCubeMin, roomCubeMax); 
            
            
            //  
            if(hitPoint.x < -0.9999) {
                surfaceColor = vec3(1.0, 0.0, 0.1);
            }                        
            else if(hitPoint.x > 0.9999) {
                surfaceColor = vec3(0.3, 1.0, 0.1);            
            }
            else {
                surfaceColor = vec3(0.8, 0.8, 0.8);
            }
            
            //  Compute the Ray from the Hit Point to the Light Ray.
            vec3 hitToLightRay = normalize(lightPosition - hitPoint);
            
            //  Compute the Distance.
            float hitPointToLightDistance = length(lightPosition - hitPoint);
            
            //  Compute the Contribution.
            float lightContribution = 1.0 / (hitPointToLightDistance * hitPointToLightDistance);
            
            //  Compute the Diffuse Value.
            float diffuseValue = max(0.0, dot(normalize(hitToLightRay), normal));
            
            //  Update the Attrition Mask.
            attritionMask = attritionMask * surfaceColor;
            
            //  Accumulate the Color.
            accumulatedColor = accumulatedColor + attritionMask * diffuseValue * lightContribution * 1.0 / 3.14;
            
            //  Get Ready for the Bounce.
            //  Change the Origin to be the Hit Point.
            origin = hitPoint;
            
            //  Compute the Cosine Weight Direction.
            currentRay.xyz = cosineWeightedDirection(seed, normal); 
            
            //  Update the Attrition Mask - since the next iteration is a contribution to the indirect diffuse lighting. 
            attritionMask = attritionMask * 2.0 * max(0.0, dot(normalize(currentRay.xyz), normal)) / 3.14;
        } 
        else
        { 
            break;
        }
    }
    
    return accumulatedColor;
}


void main() {
    
    //  Zero!
    vec3 accumulatedColor = vec3(0.0);
    
    //  Accumlate The Color From the Traced Ray.
    accumulatedColor = accumulatedColor + traceRay(uRandomSeed);
    
    //  Output Color!
    gl_FragColor = vec4( accumulatedColor, 1.0);
}


`;



var pathTracerShaderSources = {

    "vertexShaderSource" : pathTracerVSSource,
    "fragmentShaderSource" : pathTracerFSSource

};
