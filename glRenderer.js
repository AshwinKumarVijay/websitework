

class GLRenderer {

    constructor(gl) {
        this.gl = gl;

        this.gl.getExtension('EXT_color_buffer_float');

        //  Construct the Matrices.
        this.constructProjectionAndViewMatrices();

        //  Construct the Generic Data.
        this.constructCommonShaderData();

        //  Construct the Buffers.
        this.constructFSQBuffers();

        //  Construct the Textures.  
        this.constructTextures();

        //  Construct the FrameBuffers.
        this.constructFrameBuffers();

        //  Construct the Shaders.
        this.constructShaders();

        //  Construct the Accumulation State.
        this.constructAccumulationStateData();

        //  Clear the Canvas.
        this.clearCanvas();
    }


    constructProjectionAndViewMatrices() {

        //  
        this.fieldOfViewDegrees = 55;
        this.fieldOfView = this.fieldOfViewDegrees * Math.PI / 180;
        this.aspectRatio = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        this.zNear = 0.1;
        this.zFar = 1.0;


        //  Construct the Perspective Matrix.
        this.projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(this.projectionMatrix, this.fieldOfView, this.aspectRatio, this.zNear, this.zFar);


        //  Construct the Inverse Project Matrix.
        this.inverseProjectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.invert(this.inverseProjectionMatrix, this.projectionMatrix);


        //  The eyePoint, the lookAtPoint, and the upVector.
        this.eyePoint = glMatrix.vec4.fromValues(0.0, 0.0, 0.0);
        this.lookAtPoint = glMatrix.vec4.fromValues(0.0, 0.0, -1.0);
        this.upVector = glMatrix.vec4.fromValues(0.0, 1.0, 0.0);

        //  The View Matrix.
        this.viewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.lookAt(this.viewMatrix, this.eyePoint, this.lookAtPoint, this.upVector);


        //  Construct the Model View Matrix.
        this.modelViewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0.0, 0.0, 0.0]);



        //  Compute.
        var normalizedX = ((2 * (this.gl.canvas.clientWidth) / this.gl.canvas.clientWidth) - 1);
        var normalizedY = ((2 * (this.gl.canvas.clientHeight) / this.gl.canvas.clientHeight) - 1);

        var px = ((2 * (800) / this.gl.canvas.clientWidth) - 1) * Math.tan(this.fieldOfViewDegrees / 2 * Math.PI / 180) * this.aspectRatio;
        var py = ((2 * (450) / this.gl.canvas.clientHeight) - 1) * Math.tan(this.fieldOfViewDegrees / 2 * Math.PI / 180);

        this.testRayOne = glMatrix.vec3.fromValues(px, py, -1);
        console.log(this.testRayOne);

        glMatrix.vec3.normalize(this.testRayOne, this.testRayOne);
        console.log(this.testRayOne);


        //  Get the Pixel Coordinates.
        this.pixelCoordinates = glMatrix.vec4.fromValues(0, 0, 0.0, 1.0);

        //  Construct the Test Ray.
        this.testRay = glMatrix.vec4.create();
        glMatrix.vec4.transformMat4(this.testRay, this.pixelCoordinates, this.inverseProjectionMatrix);
        console.log(this.testRay);

        //  Construct the Ray Direction.
        this.testRay = glMatrix.vec4.fromValues(this.testRay[0] / this.testRay[3], this.testRay[1] / this.testRay[3], -1 / this.testRay[3], 0.0);
        console.log(this.testRay);

        //  Normalize the Ray Direction.
        glMatrix.vec4.normalize(this.testRay, this.testRay);
        console.log(this.testRay);


        //  
        var cubeMin = glMatrix.vec3.fromValues(-1.0, -1.0, -1.0);
        var cubeMax = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);

        //
        var origin = glMatrix.vec3.fromValues(0, 0, 0);
        var ray = glMatrix.vec3.fromValues(this.testRay[0], this.testRay[1], -1);

        var t = this.intersectCube(origin, ray, cubeMin, cubeMax);
        console.log(t);

        glMatrix.vec3.scale(ray, ray, t[1]);
        console.log(ray);

        this.normalForCube(cubeMin, cubeMax);
    }


    intersectCube(origin, ray, cubeMin, cubeMax) {

        var originToCubeMin = glMatrix.vec3.create();
        glMatrix.vec3.subtract(originToCubeMin, cubeMin, origin);

        var tMin = glMatrix.vec3.create();
        glMatrix.vec3.divide(tMin, originToCubeMin, ray);


        var originToCubeMax = glMatrix.vec3.create();
        glMatrix.vec3.subtract(originToCubeMax, cubeMax, origin);

        var tMax = glMatrix.vec3.create();
        glMatrix.vec3.divide(tMax, originToCubeMax, ray);


        var t1 = glMatrix.vec3.create();
        glMatrix.vec3.min(t1, tMin, tMax);

        var t2 = glMatrix.vec3.create();
        glMatrix.vec3.max(t2, tMin, tMax);

        var tNear = Math.max(Math.max(t1[0], t1[1]), t1[2]);
        var tFar = Math.min(Math.min(t2[0], t2[1]), t2[2]);

        var t = glMatrix.vec2.fromValues(tNear, tFar);

        return t;
    }



    normalForCube(hitPoint, cubeMin, cubeMax) {

        if (hitPoint[0] < cubeMin[0] + 0.0001) {
            return glMatrix.vec3.fromValues(-1.0, 0.0, 0.0);
        }
        else if (hitPoint[0] > cubeMax[0] - 0.0001) {
            return glMatrix.vec3.fromValues(1.0, 0.0, 0.0);
        }
        else if (hitPoint[1] < cubeMin[1] + 0.0001) {
            return glMatrix.vec3.fromValues(0.0, -1.0, 0.0);
        }
        else if (hitPoint[1] > cubeMax[1] - 0.0001) {
            return glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
        }
        else if (hitPoint[2] < cubeMin[2] + 0.0001) {
            return glMatrix.vec3.fromValues(0.0, 0.0, -1.0);
        }
        else {
            return glMatrix.vec3(0.0, 0.0, 1.0);
        }


    }

    constructCommonShaderData() {

        this.screenResolution = glMatrix.vec2.fromValues(this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);
        this.frameCount = 0;

    }




    constructFSQBuffers() {

        //  The Fullscreen Quad Vertices.
        this.fullscreenQuadVertices = this.gl.createBuffer();

        //  The Vertices.
        var vertices = [
            1.0, 1.0, -0.5, 1.0,
            -1.0, 1.0, -0.5, 1.0,
            1.0, -1.0, -0.5, 1.0,
            -1.0, -1.0, -0.5, 1.0
        ];


        //  Bind this buffer to the Array Buffer, then fill the buffer with the vertices.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullscreenQuadVertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    }




    constructTextures() {


        //  
        var pathTraceTexture = this.constructClientSizeRGBATexture();

        //  Construct the Offscreen Texture A and B.
        var offscreenTextureA = this.constructClientSizeRGBATexture();
        var offscreenTextureB = this.constructClientSizeRGBATexture();

        //  Save the Textures.
        this.textureData = {
            pathTraceTexture : pathTraceTexture, 
            offscreenTextureA: offscreenTextureA,
            offscreenTextureB: offscreenTextureB,
        };


    }



    constructClientSizeRGBATexture() {

        var newTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, newTexture);

        const level = 0;
        const internalFormat = this.gl.RGBA32F;
        const border = 0;
        const format = this.gl.RGBA;
        const type = this.gl.FLOAT;
        const data = null;
        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat,
            this.gl.canvas.clientWidth, this.gl.canvas.clientHeight, border,
            format, type, data);



        //  
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        return newTexture;
    }


    constructFrameBuffers() {


        //  Path Trace Framebuffer!
        var pathTraceFrameBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, pathTraceFrameBuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.textureData.pathTraceTexture, 0);

        
        // Construct Framebuffer A.
        var framebufferA = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebufferA);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.textureData.offscreenTextureA, 0);

        // Construct Framebuffer B.
        var framebufferB = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebufferB);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.textureData.offscreenTextureB, 0);


        //  Framebuffer Data.
        this.frameBufferData = {
            pathTraceFrameBuffer: pathTraceFrameBuffer,
            framebufferA: framebufferA,
            framebufferB: framebufferB,
        };


        //  Reset to default.
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }


    constructShaders() {

        //  Construct the Path Tracer Shaders.
        this.constructPathTracerShaders();

        //  Construct the Accumulation Shaders;
        this.constructAccumulationShaders();

        //  Construct the Copy Shaders.
        this.constructCopyShaders();
    }


    constructCopyShaders() {


        //  Vertex Shader Source.
        const vsSource = `
    
            precision highp float;
                
            attribute vec4 aVertexPosition;
    
            uniform mat4 uProjectionMatrix;
            uniform mat4 uModelViewMatrix;
    
    
            void main() {
    
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    
            }
    
        `;


        //  Fragment Shader Source.
        const fsSource = `

            precision highp float;

            uniform sampler2D uTextureSampler;
     
            uniform vec2 uScreenResolution;

            void main() {

                float pixelX = (gl_FragCoord.x / uScreenResolution.x);
                float pixelY = (gl_FragCoord.y / uScreenResolution.y);

                vec4 color = texture2D(uTextureSampler, vec2(pixelX, pixelY));

                gl_FragColor = vec4(color.xyz, 1.0);

            }

        `;



        //  Compile the Vertex Shader.
        var vertexShader = this.compileShaderFromSource(this.gl.VERTEX_SHADER, vsSource);

        //  Construct the Fragment Shader.
        var fragmentShader = this.compileShaderFromSource(this.gl.FRAGMENT_SHADER, fsSource);

        //  Construct the Renderer Shader.
        var shaderProgram = this.constructShaderProgramFromVertexAndFragmentShaders(vertexShader, fragmentShader);


        //  Shader Program.
        this.copyShaderProgramData = {

            shaderProgram: shaderProgram,

            //  
            vertexAttributeLocations: {

                //  Get the Vertex Position Attribute Location for the Vertex Position.
                aVertexPosition: this.gl.getAttribLocation(shaderProgram, "aVertexPosition"),

            },

            uniformLocations: {

                //  Get the Uniform Location for the Projection Matrix.
                uProjectionMatrix: this.gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),

                //  Get the Uniform Location for the ModelViewMatrix.
                uModelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),

                //  Get the Uniform Location for the Screen Resolution.
                uScreenResolution: this.gl.getUniformLocation(shaderProgram, 'uScreenResolution'),

                //  Get the Uniform Locaiton for the Texture Sampler.
                uTextureSampler: this.gl.getUniformLocation(shaderProgram, 'uTextureSampler'),
            }
        };

    }



    constructAccumulationShaders() {


        //  Vertex Shader Source.
        const vsSource = `
    
            precision highp float;
                
            attribute vec4 aVertexPosition;
    
            uniform mat4 uProjectionMatrix;
            uniform mat4 uModelViewMatrix;
    
    
            void main() {
    
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    
            }
    
        `;


        //  Fragment Shader Source.
        const fsSource = `

            precision highp float;

            uniform sampler2D uTextureSamplerA;
            uniform sampler2D uTextureSamplerB;
     
            uniform float uFrameCount;
            uniform vec2 uScreenResolution;

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
                gl_FragColor = vec4(weightedColor.xyz, 1.0);
            }

        `;



        //  Compile the Vertex Shader.
        var vertexShader = this.compileShaderFromSource(this.gl.VERTEX_SHADER, vsSource);

        //  Construct the Fragment Shader.
        var fragmentShader = this.compileShaderFromSource(this.gl.FRAGMENT_SHADER, fsSource);

        //  Construct the Renderer Shader.
        var shaderProgram = this.constructShaderProgramFromVertexAndFragmentShaders(vertexShader, fragmentShader);


        //  Shader Program.
        this.accumulationShaderProgramData = {

            shaderProgram: shaderProgram,

            //  
            vertexAttributeLocations: {

                //  Get the Vertex Position Attribute Location for the Vertex Position.
                aVertexPosition: this.gl.getAttribLocation(shaderProgram, "aVertexPosition"),

            },

            uniformLocations: {

                //  Get the Uniform Location for the Screen Resolution.
                uScreenResolution: this.gl.getUniformLocation(shaderProgram, 'uScreenResolution'),

                //  Get the Uniform Location for the Projection Matrix.
                uProjectionMatrix: this.gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),

                //  Get the Uniform Location for the ModelViewMatrix.
                uModelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),

                //  Random Seed Value.
                "uFrameCount" : this.gl.getUniformLocation(shaderProgram, "uFrameCount"), 


                //  Get the Uniform Location for the Texture Sampler.
                "uTextureSamplerA" : this.gl.getUniformLocation(shaderProgram, 'uTextureSamplerA'),
                "uTextureSamplerB" : this.gl.getUniformLocation(shaderProgram, 'uTextureSamplerB'),
            }
        };

    }



    constructPathTracerShaders() {

        //  Vertex Shader Source.
        const vsSource = `
    
            precision highp float;
            
            attribute vec4 aVertexPosition;

            uniform mat4 uProjectionMatrix;
            uniform mat4 uModelViewMatrix;


            void main() {

                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

            }            

        `;


        //  Fragment Shader Source.
        const fsSource = `
    
            precision highp float;

            uniform vec2 uScreenResolution;
            uniform float uRandomSeedValue;
            
            uniform mat4 uProjectionMatrix;
            uniform mat4 uModelViewMatrix;

            uniform mat4 uInverseProjectionMatrix;


            //  Random Vec3.
            float random(vec3 scale, float seed) {
                return fract(sin(dot( vec3(seed, seed, seed), scale)) * 43758.5453 + seed);
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

                //  Compute the Current Pixel X and Y.
                float pixelX = ( (gl_FragCoord.x) * 2.0 / uScreenResolution.x) - 1.0;
                float pixelY = ( (gl_FragCoord.y) * 2.0 / uScreenResolution.y) - 1.0;
                                
                //  Construct the Vector for the the Current Pixel Coordinates.
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


                //  For each bounce.
                    //  Compute the intersection of the ray with the opaque scene.
                    //  Compute the effect of the volume.
            

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

                //  
                vec3 accumulatedColor = vec3(0.0);

                accumulatedColor = accumulatedColor + traceRay(uRandomSeedValue);    
                //  accumulatedColor = vec3(243.0 / 255.0, 243.0 / 255.0, 243.0 / 255.0);

                //  
                gl_FragColor = vec4(accumulatedColor.xyz, 1.0);
            }

        `;


        //  Compile the Vertex Shader.
        var vertexShader = this.compileShaderFromSource(this.gl.VERTEX_SHADER, vsSource);

        //  Construct the Fragment Shader.
        var fragmentShader = this.compileShaderFromSource(this.gl.FRAGMENT_SHADER, fsSource);

        //  Construct the Renderer Shader.
        var shaderProgram = this.constructShaderProgramFromVertexAndFragmentShaders(vertexShader, fragmentShader);


        //  
        this.pathTracerShaderProgramData = {

            //  The Shader Program.
            shaderProgram: shaderProgram,

            //  
            vertexAttributeLocations: {

                //  Get the Vertex Position Attribute Location for the Vertex Position.
                aVertexPosition: this.gl.getAttribLocation(shaderProgram, "aVertexPosition"),

            },

            uniformLocations: {

                //  Random Seed Value.
                "uRandomSeedValue" : this.gl.getUniformLocation(shaderProgram, "uRandomSeedValue"), 

                //  Get the Uniform Location for the Projection Matrix.
                uProjectionMatrix: this.gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),

                //  Get the Uniform Location for the ModelViewMatrix.
                uModelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),

                //  Get the Uniform Locaiton for the Inverse Projection Matrix.
                uInverseProjectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uInverseProjectionMatrix'),

                //  Get the Unfirom Location for the Screen Resolution.
                uScreenResolution: this.gl.getUniformLocation(shaderProgram, 'uScreenResolution'),
            }

        };

    }


    compileShaderFromSource(type, source) {

        //  Get the Shader.
        const shader = this.gl.createShader(type);

        // Send the source to the shader object
        this.gl.shaderSource(shader, source);

        // Compile the shader program
        this.gl.compileShader(shader);

        // See if it compiled successfully.      
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {

            alert('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));

            this.gl.deleteShader(shader);

            return null;
        }

        //  
        return shader;
    }


    constructShaderProgramFromVertexAndFragmentShaders(vertexShader, fragmentShader) {

        //  Create the Shader Program.
        const shaderProgram = this.gl.createProgram();

        //  
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);

        this.gl.linkProgram(shaderProgram);

        //  Create an alert if the Shader Program failed to compile.
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        //  Return the Shader Program.
        return shaderProgram;
    }



    //  
    constructAccumulationStateData() {

        this.accumulationStateData = {
            currentAccumulationState : "AToB",
            currentInputTexture : this.textureData.offscreenTextureA,
            currentOutputTexture : this.textureData.offscreenTextureB,
            currentFramebuffer : this.frameBufferData.framebufferB
        };

    }


    swapAccumulationState() {

        if(this.accumulationStateData.currentAccumulationState == "AToB") {

            this.accumulationStateData = {
                currentAccumulationState : "BToA",
                currentInputTexture : this.textureData.offscreenTextureB,
                currentOutputTexture : this.textureData.offscreenTextureA,
                currentFramebuffer : this.frameBufferData.framebufferA
            };    
        }
        else {
            this.accumulationStateData = {
                currentAccumulationState : "AToB",
                currentInputTexture : this.textureData.offscreenTextureA,
                currentOutputTexture : this.textureData.offscreenTextureB,
                currentFramebuffer : this.frameBufferData.framebufferB
            };    
        }


    }



    clearCanvas() {

        //  Set the Clear Color.
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        //  Enable Depth Tests now.
        this.gl.enable(this.gl.DEPTH_TEST);

        //  Use forward z, and set the clear depth.
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clearDepth(1.0);

        //  Clear the Color and Depth.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }



    updateUniformsForProjectionAndViewMatrices(shaderProgramData) {

        //  Set the Projection Matrix.
        this.gl.uniformMatrix4fv(
            shaderProgramData.uniformLocations.uProjectionMatrix,
            false,
            this.projectionMatrix);


        //  Set the Model View Matrix.
        this.gl.uniformMatrix4fv(
            shaderProgramData.uniformLocations.uModelViewMatrix,
            false,
            this.modelViewMatrix);
    }

    updateUniformsForInverseProjectionMatrix(shaderProgramData) {

        this.gl.uniformMatrix4fv(
            shaderProgramData.uniformLocations.uInverseProjectionMatrix,
            false,
            this.inverseProjectionMatrix);

    }


    updateUniformsForGenericData(shaderProgramData) {

        //  Set the Screen Resolution.
        this.gl.uniform2fv(
            shaderProgramData.uniformLocations.uScreenResolution,
            this.screenResolution
        );

        //
        if("uRandomSeedValue" in shaderProgramData.uniformLocations) {

            this.gl.uniform1f(
                shaderProgramData.uniformLocations.uRandomSeedValue,
                this.frameCount
            );

        }


        //
        if("uFrameCount" in shaderProgramData.uniformLocations) {

            this.gl.uniform1f(
                shaderProgramData.uniformLocations.uFrameCount,
                this.frameCount
            );
                    
        }
        
    }


    drawPathTracer() {

        //  Bind the FrameBuffer!  
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBufferData.pathTraceFrameBuffer)

        // Clear both the color texture and the depth texture.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        //  Use the Shader Program.
        this.gl.useProgram(this.pathTracerShaderProgramData.shaderProgram);

        //  Update the Uniforms for the Projection and View Matrices.
        this.updateUniformsForProjectionAndViewMatrices(this.pathTracerShaderProgramData);
        this.updateUniformsForInverseProjectionMatrix(this.pathTracerShaderProgramData);
            

        //  Update the Uniforms for the Generic Data.
        this.updateUniformsForGenericData(this.pathTracerShaderProgramData);

        //  Bind this buffer to the ARRAY_BUFFER.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullscreenQuadVertices);

        //  Enable it and set the Vertex Attrib Pointer.
        this.gl.enableVertexAttribArray(this.pathTracerShaderProgramData.vertexAttributeLocations.aVertexPosition);
        this.gl.vertexAttribPointer(this.pathTracerShaderProgramData.vertexAttributeLocations.aVertexPosition, 4, this.gl.FLOAT, false, 0, 0);

        //  Draw the 2 Triangles!
        const offset = 0;
        const vertexCount = 4;
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);

    }


    drawAccumulation() {

        //  Bind the FrameBuffer!
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.accumulationStateData.currentFramebuffer);

        // Clear both the color texture and the depth texture.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        //  Use the Shader Program.
        this.gl.useProgram(this.accumulationShaderProgramData.shaderProgram);

        //  Upload the Textures.
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureData.pathTraceTexture);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.accumulationStateData.currentInputTexture);

        //  
        this.gl.uniform1i(this.accumulationShaderProgramData.uniformLocations["uTextureSamplerA"], 0);
        this.gl.uniform1i(this.accumulationShaderProgramData.uniformLocations["uTextureSamplerB"], 1);

        //  Update the Uniforms for the Projection and View Matrices.
        this.updateUniformsForProjectionAndViewMatrices(this.accumulationShaderProgramData);

        //  Update the Uniforms for the Generic Data.
        this.updateUniformsForGenericData(this.accumulationShaderProgramData);

        //  
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullscreenQuadVertices);

        //  Enable it and set the Vertex Attrib Pointer.
        this.gl.enableVertexAttribArray(this.accumulationShaderProgramData.vertexAttributeLocations.aVertexPosition);
        this.gl.vertexAttribPointer(this.accumulationShaderProgramData.vertexAttributeLocations.aVertexPosition, 4, this.gl.FLOAT, false, 0, 0);

        //  Draw the 2 Triangles!
        const offset = 0;
        const vertexCount = 4;
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);

    }



    drawToCanvas() {

        //  Bind the FrameBuffer!
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        // Clear both the color texture and the depth texture.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        //  Use the Shader Program.
        this.gl.useProgram(this.copyShaderProgramData.shaderProgram);

        //  Upload the Texture.
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.accumulationStateData.currentOutputTexture);
        this.gl.uniform1i(this.copyShaderProgramData.uniformLocations.uTextureSampler, 0);

        //  Update the Uniforms for the Projection and View Matrices.
        this.updateUniformsForProjectionAndViewMatrices(this.copyShaderProgramData);

        //  Update the Uniforms for the Generic Data.
        this.updateUniformsForGenericData(this.copyShaderProgramData);

        //  
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullscreenQuadVertices);

        //  Enable it and set the Vertex Attrib Pointer.
        this.gl.enableVertexAttribArray(this.copyShaderProgramData.vertexAttributeLocations.aVertexPosition);
        this.gl.vertexAttribPointer(this.copyShaderProgramData.vertexAttributeLocations.aVertexPosition, 4, this.gl.FLOAT, false, 0, 0);

        //  Draw the 2 Triangles!
        const offset = 0;
        const vertexCount = 4;
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
    }




    draw(deltaTimeInSeconds, currentTimeInSeconds, previousTimeInSeconds) {

        //  Draw with the Path Tracer!
        this.drawPathTracer();

        //  Draw to the Accumulation Texture.
        this.drawAccumulation();

        //  Draw to the Canvas.
        this.drawToCanvas();

        //  Add to the frameCount.
        this.frameCount = this.frameCount + 1;

        //  Swap the Accumulation State.
        this.swapAccumulationState();

    }







}