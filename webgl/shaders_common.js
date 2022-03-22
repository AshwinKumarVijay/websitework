var noiseFunctionShaderSource = `

uint ns;

#define INIT_RNG ns = 185730U*uint(uRandomSeed)+uint(uScreenResolution.x + uScreenResolution.y * uScreenResolution.x);



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

`;