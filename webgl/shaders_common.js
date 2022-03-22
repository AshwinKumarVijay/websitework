

var commonShaderVersionSource = 
`#version 300 es 

#define pi 3.141592653589793
#define twopi 3.141592653589793*2.0

`;


var noiseFunctionShaderSource = `

uint ns;

#define INIT_RNG ns = 185730U*uint(uRandomSeed)+uint(gl_FragCoord.x + gl_FragCoord.y * uScreenResolution.x);


void pcg(){

    uint state = ns*747796405u+2891336453u;

    uint word = ((state >> ((state >> 28u)+4u))^state)*277803737u;

    ns = (word >> 22u)^word;
}


float rand()
{
    pcg(); return float(ns)/float(0xffffffffu);
}

vec2 rand2()
{
    return vec2(rand(), rand());
}

vec3 rand3()
{
    return vec3(rand(), rand(), rand());
}

vec4 rand4()
{
    return vec4(rand(), rand(), rand(), rand());
}


vec2 nrand2(float sigma, vec2 mean)
{
    vec2 Z = rand2(); 
    return mean + sigma * sqrt(-2.0 * log(Z.x)) * vec2(cos(twopi * Z.y) , sin(twopi * Z.y));
}


vec3 nrand3(float sigma, vec3 mean)
{   
    vec4 Z = rand4(); 
    return mean + sigma * sqrt(-2.0*log(Z.xxy)) * vec3(cos(twopi * Z.z), sin(twopi * Z.z), cos(twopi * Z.w));
}

`;