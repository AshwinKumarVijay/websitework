

class GLRenderer {

    constructor(gl) {
        this.gl = gl;

        //
        this.frameCount = 0;

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

        //  Clear the Canvas.
        this.clearCanvas();    
    }


    
    constructProjectionAndViewMatrices() {

        //  Set the Camera Properties.
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
        this.pixelCoordinates = glMatrix.vec4.fromValues(0.5, 0.5, 0.0, 1.0);
        
        //  Construct the Test Ray.
        this.testRay = glMatrix.vec4.create();
        glMatrix.vec4.transformMat4(this.testRay, this.pixelCoordinates, this.inverseProjectionMatrix);
        console.log(this.testRay);

        //  Construct the Ray Direction.
        this.testRay = glMatrix.vec4.fromValues(this.testRay[0] / this.testRay[3] , this.testRay[1] / this.testRay[3], -1 / this.testRay[3], 0.0);
        console.log(this.testRay);

        //  Normalize the Ray Direction.
        glMatrix.vec4.normalize(this.testRay, this.testRay);
        console.log(this.testRay);
        

    }


    constructCommonShaderData() {

        this.screenResolution = glMatrix.vec2.fromValues(this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);

    }




    constructFSQBuffers() {

        //  The Fullscreen Quad Vertices.
        this.fullscreenQuadVertices = this.gl.createBuffer();

        //  The Vertices.
        var vertices = [
            1.0,  1.0, -0.5, 1.0,
           -1.0,  1.0, -0.5, 1.0,
            1.0, -1.0, -0.5, 1.0,
           -1.0, -1.0, -0.5, 1.0
        ];


        //  Bind this buffer to the Array Buffer, then fill the buffer with the vertices.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullscreenQuadVertices);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    }




    constructTextures() {
    
        //  Construct the Offscreen Texture A and B.
        var offscreenTextureA = this.constructClientSizeRGBATexture();
        var offscreenTextureB = this.constructClientSizeRGBATexture();

        //  Save the Textures.
        this.textureData = {
            offscreenTextureA : offscreenTextureA,
            offscreenTextureB : offscreenTextureB,
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
        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight, border, format, type, data);
                
        //  
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        return newTexture;
    }


    constructFrameBuffers() {

        // Construct Framebuffer A.
        var framebufferA = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebufferA);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.textureData.offscreenTextureA, 0);

        // Construct Framebuffer B.
        var framebufferB = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebufferB);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.textureData.offscreenTextureB, 0);

        //  Framebuffer Data.
        this.framebufferData = {
            framebufferA : framebufferA,
            framebufferB : framebufferB,
        };


        //  Reset to default.
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }


    constructShaders() {

        //  Construct the Path Tracer Shaders.
        this.constructPathTracerShaders();

        //  Construct the Copy Shaders.
        this.constructCopyShaders();
    }


    constructCopyShaders() {


        //  Vertex Shader Source.
        const vsSource = copyShaderSources["vertexShaderSource"];

        //  Fragment Shader Source.
        const fsSource = copyShaderSources["fragmentShaderSource"];


        //  Compile the Vertex Shader.
        var vertexShader = this.compileShaderFromSource(this.gl.VERTEX_SHADER, vsSource);

        //  Construct the Fragment Shader.
        var fragmentShader = this.compileShaderFromSource(this.gl.FRAGMENT_SHADER, fsSource);
        
        //  Construct the Renderer Shader.
        var shaderProgram = this.constructShaderProgramFromVertexAndFragmentShaders(vertexShader, fragmentShader);
        
        
        //  Shader Program.
        this.copyShaderProgramData = {
            
            shaderProgram : shaderProgram,

            //  
            vertexAttributeLocations : {

                //  Get the Vertex Position Attribute Location for the Vertex Position.
                aVertexPosition: this.gl.getAttribLocation(shaderProgram, "aVertexPosition"),

            },

            uniformLocations : {


                //  Get the Uniform Location for the Projection Matrix.
                "uProjectionMatrix": this.gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            
                //  Get the Uniform Location for the ModelViewMatrix.
                "uModelViewMatrix": this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),

                //  Get the Uniform Location for the Screen Resolution.
                "uScreenResolution": this.gl.getUniformLocation(shaderProgram, 'uScreenResolution'),
                
                //  Get the Uniform Location for the Texture Sampler.
                "uSourceTexture": this.gl.getUniformLocation(shaderProgram, 'uSourceTexture'),
            }
        };

    }





    constructPathTracerShaders() {

        //  Vertex Shader Source.
        const vsSource = pathTracerShaderSources["vertexShaderSource"];
        
        //  Fragment Shader Source.
        const fsSource = pathTracerShaderSources["fragmentShaderSource"];
    
        
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
            vertexAttributeLocations : {

                //  Get the Vertex Position Attribute Location for the Vertex Position.
                aVertexPosition: this.gl.getAttribLocation(shaderProgram, "aVertexPosition"),

            },

            uniformLocations : {


                //  Get the Uniform Location for the Projection Matrix.
                "uProjectionMatrix": this.gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            
                //  Get the Uniform Location for the ModelViewMatrix.
                "uModelViewMatrix": this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),

                //  Get the Uniform Locaiton for the Inverse Projection Matrix.
                "uInverseProjectionMatrix": this.gl.getUniformLocation(shaderProgram, 'uInverseProjectionMatrix'),

                //  Get the Uniform Location for the Screen Resolution.
                "uScreenResolution": this.gl.getUniformLocation(shaderProgram, 'uScreenResolution'),
                
                //  Get the Uniform Location for the Random Seed.
                "uRandomSeed" : this.gl.getUniformLocation(shaderProgram, 'uRandomSeed'),
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
            shaderProgramData.uniformLocations["uProjectionMatrix"],
            false,
            this.projectionMatrix);
        

        //  Set the Model View Matrix.
        this.gl.uniformMatrix4fv(
            shaderProgramData.uniformLocations["uModelViewMatrix"],
            false,
            this.modelViewMatrix);
    }

    updateUniformsForInverseProjectionMatrix(shaderProgramData) {
        //          
        this.gl.uniformMatrix4fv(
            shaderProgramData.uniformLocations["uInverseProjectionMatrix"],
            false,
            this.inverseProjectionMatrix);
    }


    updateUniformsForGenericData(shaderProgramData) {

        //  Set the Screen Resolution.
        this.gl.uniform2fv(
            shaderProgramData.uniformLocations["uScreenResolution"],
            this.screenResolution
        );

        //  Set the Random Seed.
        this.gl.uniform1f(
            shaderProgramData.uniformLocations["uRandomSeed"],
            this.frameCount
        );

    }


    drawPathTracer() {
                
        //  Bind the FrameBuffer!  
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebufferData.framebufferA)

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


    
    drawToCanvas() {

        //  Bind the FrameBuffer!
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        // Clear both the color texture and the depth texture.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        //  Use the Shader Program.
        this.gl.useProgram(this.copyShaderProgramData.shaderProgram);

        //  Upload the Texture.
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureData.offscreenTextureA);
        this.gl.uniform1i(this.copyShaderProgramData.uniformLocations.uSourceTexture, 0);

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
        
        //  Draw to the Canvas.
        this.drawToCanvas();

        //  Add the Frame Count.
        this.frameCount = this.frameCount + 1;
             
    }



}