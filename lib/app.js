var canvas;

var gl = null,
	program = null,
	carMesh = null,
	skybox = null,
	imgtx = null,
	skyboxLattx = null,
	skyboxTbtx = null;

var projectionMatrix,
	perspectiveMatrix,
	viewMatrix,
	worldMatrix,
	gLightDir,
	skyboxWM;


//Parameters for Camera
var cx = 4.5;
var cy = 5.0;
var cz = 10.0;
var pitch = 0.0;
var angle = 0.01;
var roll = 0.00;

var carAngle = 180;
var carX = -175;
var carY = 100;
var carZ = 5;

var lookRadius = 10.0;

var currentPos= new Quaternion();

var keys = [];
var vz = 0.0;
var vx = 0.0;
var vy = 0.0;
var rvy = 0.0;
var rvz = 0.0;
var rvx= 0.0;

var carLinVel = -0.5;

var playing = true;

var keyFunctionDown =function(e) {
  if(!keys[e.keyCode]) {
  	keys[e.keyCode] = true;
	switch(e.keyCode) {
	  case 37:
//console.log("KeyUp   - Dir LEFT");
		rvy = rvy + 1.0;
		break;
	  case 39:
//console.log("KeyUp   - Dir RIGHT");
		rvy = rvy - 1.0;
		break;
	  case 38:
//console.log("KeyUp   - Dir UP");
		//vy = vy + 1.0;
		rvx = rvx +1.0;
		break;
	  case 40:
//console.log("KeyUp   - Dir DOWN");
		//vy = vy - 1.0;
		rvx = rvx -1.0;
		break;
		//"space" go fast
	  case 32:
		  vz=vz-1.0;
		break;
		case 13:
			playing=true;

	}
  }
}

var keyFunctionUp =function(e) {
  if(keys[e.keyCode]) {
  	keys[e.keyCode] = false;
	switch(e.keyCode) {
	  case 37:
//console.log("KeyDown  - Dir LEFT");
		rvy = rvy - 1.0;
		break;
	  case 39:
//console.log("KeyDown - Dir RIGHT");
		rvy = rvy + 1.0;
		break;
	  case 38:
//console.log("KeyDown - Dir UP");
		//vy = vy - 1.0;
		rvx = rvx -1.0;
		break;
	  case 40:
//console.log("KeyDown - Dir DOWN");
		//vy = vy + 1.0;
		rvx = rvx +1.0;
		break;

		case 32:

			vz=vz+1.0;
			break;
	}
  }
}

var aspectRatio;

function doResize() {
    // set canvas dimensions
	var canvas = document.getElementById("my-canvas");
    if((window.innerWidth > 40) && (window.innerHeight > 240)) {
		canvas.width  = window.innerWidth-16;
		canvas.height = window.innerHeight-200;
		var w=canvas.clientWidth;
		var h=canvas.clientHeight;

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.viewport(0.0, 0.0, w, h);

		aspectRatio = w/h;
    }
}


// Vertex shader
var vs = `#version 300 es
#define POSITION_LOCATION 0
#define NORMAL_LOCATION 1
#define UV_LOCATION 2

layout(location = POSITION_LOCATION) in vec3 in_pos;
layout(location = NORMAL_LOCATION) in vec3 in_norm;
layout(location = UV_LOCATION) in vec2 in_uv;

uniform mat4 pMatrix;
uniform mat4 nMatrix;

out vec3 fs_pos;
out vec3 fs_norm;
out vec2 fs_uv;

void main() {
	fs_pos = in_pos;
	fs_norm = (nMatrix * vec4(in_norm, 0.0)).xyz;
	fs_uv = vec2(in_uv.x, 1.0-in_uv.y);
	
	gl_Position = pMatrix * vec4(in_pos, 1.0);
}`;

// Fragment shader
var fs = `#version 300 es
precision highp float;

in vec3 fs_pos;
in vec3 fs_norm;
in vec2 fs_uv;

uniform sampler2D u_texture;
uniform vec4 lightDir;
//uniform float ambFact;

out vec4 color;

void main() {
	vec4 texcol = texture(u_texture, fs_uv);
	float ambFact = lightDir.w;
	float dimFact = (1.0-ambFact) * clamp(dot(normalize(fs_norm), lightDir.xyz),0.0,1.0) + ambFact;
	color = vec4(texcol.rgb * dimFact, texcol.a);
}`;



// texture loader callback
var textureLoaderCallback = function() {
	var textureId = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + this.txNum);
	gl.bindTexture(gl.TEXTURE_2D, textureId);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
// set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

// The real app starts here
function main(){

	// setup everything else
	var canvas = document.getElementById("my-canvas");

	window.addEventListener("keyup", keyFunctionUp, false);
	window.addEventListener("keydown", keyFunctionDown, false);
	window.onresize = doResize;
	canvas.width  = window.innerWidth-16;
	canvas.height = window.innerHeight-200;

	try{
		gl= canvas.getContext("webgl2");
	} catch(e){
		console.log(e);
	}

	if(gl){
		// Compile and link shaders
		program = gl.createProgram();
		var v1 = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(v1, vs);
		gl.compileShader(v1);
		if (!gl.getShaderParameter(v1, gl.COMPILE_STATUS)) {
			alert("ERROR IN VS SHADER : " + gl.getShaderInfoLog(v1));
		}
		var v2 = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(v2, fs)
		gl.compileShader(v2);
		if (!gl.getShaderParameter(v2, gl.COMPILE_STATUS)) {
			alert("ERROR IN FS SHADER : " + gl.getShaderInfoLog(v2));
		}
		gl.attachShader(program, v1);
		gl.attachShader(program, v2);
		gl.linkProgram(program);

		gl.useProgram(program);

		// Load mesh using the webgl-obj-loader library
		carMesh = new OBJ.Mesh(carObjStr);
		skybox = new OBJ.Mesh(trackNfieldObjStr);

		// Create the textures
		imgtx = new Image();
		imgtx.txNum = 0;
		imgtx.onload = textureLoaderCallback;
		imgtx.src = CarTextureData;

		skyboxLattx = new Image();
		skyboxLattx.txNum = 1;
		skyboxLattx.onload = textureLoaderCallback;
		skyboxLattx.src = TrackTextureData;

		skyboxTbtx = new Image();
		skyboxTbtx.txNum = 2;
		skyboxTbtx.onload = textureLoaderCallback;
		skyboxTbtx.src = FieldTextureData;

		// links mesh attributes to shader attributes
		program.vertexPositionAttribute = gl.getAttribLocation(program, "in_pos");
		gl.enableVertexAttribArray(program.vertexPositionAttribute);

		program.vertexNormalAttribute = gl.getAttribLocation(program, "in_norm");
		gl.enableVertexAttribArray(program.vertexNormalAttribute);

		program.textureCoordAttribute = gl.getAttribLocation(program, "in_uv");
		gl.enableVertexAttribArray(program.textureCoordAttribute);

		program.WVPmatrixUniform = gl.getUniformLocation(program, "pMatrix");
		program.NmatrixUniform = gl.getUniformLocation(program, "nMatrix");
		program.textureUniform = gl.getUniformLocation(program, "u_texture");
		program.lightDir = gl.getUniformLocation(program, "lightDir");
//		program.ambFact = gl.getUniformLocation(program, "ambFact");

		OBJ.initMeshBuffers(gl, carMesh);
		OBJ.initMeshBuffers(gl, skybox);

		// prepares the world, view and projection matrices.
		var w=canvas.clientWidth;
		var h=canvas.clientHeight;

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.viewport(0.0, 0.0, w, h);

//		perspectiveMatrix = utils.MakePerspective(60, w/h, 0.1, 1000.0);
		aspectRatio = w/h;

	 // turn on depth testing
	    gl.enable(gl.DEPTH_TEST);


		// algin the skybox with the light
		gLightDir = [-1.0, 0.0, 0.0, 0.0];
		skyboxWM = utils.multiplyMatrices(utils.MakeRotateZMatrix(30), utils.MakeRotateYMatrix(135));
		gLightDir = utils.multiplyMatrixVector(skyboxWM, gLightDir);

		drawScene();
	}else{
		alert("Error: WebGL not supported by your browser!");
	}
}

var lastUpdateTime;
var camVel = [0,0,0];
var fSk = 500.0;
var fDk = 2.0 * Math.sqrt(fSk);

// Driving dynamic coefficients
var sAT = 0.5;
var mAT = 5.0;
var ATur = 3.0;
var ATdr = 5.5;
var sBT = 1.0;
var mBT = 3.0;
var BTur = 5.0;
var BTdr = 5.5;
var Tfric = Math.log(0.05);
var sAS = 0.1;	// Not used yet
var mAS = 108.0;
var ASur = 1.0;	// Not used yet
var ASdr = 0.5;	// Not used yet

var carLinAcc = 0.0;

var carAngVel = 0.0;
var carVerVel = 0.0;
var carVerAcc = 0.0;
var preVz = 0;
var preVy = 0;
var currentPos= new Quaternion();



var angleX=0;
var angleY=180;
var angleZ=0;
function drawScene() {
		// compute time interval
		var currentTime = (new Date).getTime();
		var deltaT;
		if(lastUpdateTime){
			deltaT = (currentTime - lastUpdateTime) / 1000.0;
		} else {
			deltaT = 1/50;
		}
		lastUpdateTime = currentTime;


	//calculate roll
    //roll= rvy>0 ? utils.degToRad(-15) : (rvy<0 ? utils.degToRad(15) : 0);
    if (rvy<0){
        if (roll < 15){
            roll+=1;
        }
    } else if (rvy>0){
        if (roll > -15){
            roll-=1;
        }
    } else{
        if (roll>0){
            roll-=1;
        } else if(roll<0){
            roll+=1;
        }
    }
    if (rvx<0){
        if (pitch < 15){
            pitch+=1;
        }
    } else if (rvx>0){
        if (pitch  >-15){
            pitch-=1;
        }
    } else{
        if (pitch>0){
            pitch-=1;
        } else if(pitch<0){
            pitch+=1;
        }
    }

    Rrvx=utils.degToRad(pitch);
    Rrvy=utils.degToRad(rvy);
    Rrvz=utils.degToRad(roll);
    angleX=Rrvx;
    angleY+=Rrvy;
    angleZ=Rrvz;

    var rotationDirX = new Quaternion(Math.cos(angleX), Math.sin(angleX), 0, 0);
    var rotationDirY = new Quaternion(Math.cos(angleY), 0, Math.sin(angleY), 0);
    var rotationDirZ = new Quaternion(Math.cos(angleZ), 0, 0, Math.sin(angleZ));

    currentPos= rotationDirY.mul(rotationDirX.mul(rotationDirZ));
		// call user procedure for world-view-projection matrices
		wvpMats = worldViewProjection(carX, carY, carZ, carAngle, cx, cy, cz, aspectRatio,currentPos);

		viewMatrix = wvpMats[1];

		perspectiveMatrix = wvpMats[2];

		dvecmat = wvpMats[0]; //world

		// computing car velocities
		carAngVel = mAS * deltaT * rvy;
		carPitchVel = mAS * deltaT * rvx;

		vz = -vz;
		// = 0.8 * deltaT * 60 * vz;
		if(vz > 0.1) {
		  if(preVz > 0.1) {
			carLinAcc = carLinAcc + ATur * deltaT;
			if(carLinAcc > mAT) carLinAcc = mAT;
		  } else if(carLinAcc < sAT) carLinAcc = sAT;
		} else if(vz > -0.1) {
			carLinAcc = carLinAcc - ATdr * deltaT * Math.sign(carLinAcc);
			if(Math.abs(carLinAcc) < 0.001) carLinAcc = 0.0;
		} else {
		  if(preVz < 0.5) {
			carLinAcc = carLinAcc - BTur * deltaT;
			if(carLinAcc < -mBT) carLinAcc = -mBT;
		  } else if(carLinAcc > -sBT) carLinAcc = -sBT;
		}
		preVz = vz;
		vz = -vz;
		carLinVel = carLinVel * Math.exp(Tfric * deltaT) - deltaT * carLinAcc < -0.5 ?
			carLinVel * Math.exp(Tfric * deltaT) - deltaT * carLinAcc : -0.5;


		if(vy > 0.1) {
			carVerVel=-0.7;
		} else if (vy <-0.1){
			carVerVel=0.7;
		} else{
			carVerVel=0.0;
		}


		// Magic for moving the car
		worldMatrix = utils.multiplyMatrices(dvecmat, utils.MakeScaleMatrix(1.0));
		xaxis = [dvecmat[0],dvecmat[4],dvecmat[8]];
		yaxis = [dvecmat[1],dvecmat[5],dvecmat[9]];
		zaxis = [dvecmat[2],dvecmat[6],dvecmat[10]];

		// spring-camera system
			// target coordinates
		nC = utils.multiplyMatrixVector(worldMatrix, [0, 5, -10, 1]);
			// distance from target

		deltaCam = [cx - nC[0], cy - nC[1], cz - nC[2]];

		camAcc = [-fSk * deltaCam[0] - fDk * camVel[0], -fSk * deltaCam[1] - fDk * camVel[1], -fSk * deltaCam[2] - fDk * camVel[2]];

		camVel = [camVel[0] + camAcc[0] * deltaT, camVel[1] + camAcc[1] * deltaT, camVel[2] + camAcc[2] * deltaT];
		cx += camVel[0] * deltaT;
		cy += camVel[1] * deltaT;
		cz += camVel[2] * deltaT;

		// car motion
		delta = utils.multiplyMatrixVector(dvecmat, [0, carVerVel, carLinVel, 0.0]);
		carX -= delta[0];
		carZ -= delta[2];
		carY-=delta[1];

		//we have crashed!
		if(carY<-0.5){
			gameover("You have crashed");

		}

		projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);

		// draws the skybox
		gl.bindBuffer(gl.ARRAY_BUFFER, skybox.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, skybox.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	    gl.bindBuffer(gl.ARRAY_BUFFER, skybox.textureBuffer);
	    gl.vertexAttribPointer(program.textureCoordAttribute, skybox.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, skybox.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, skybox.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 1.0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skybox.indexBuffer);
		WVPmatrix = utils.multiplyMatrices(projectionMatrix,utils.MakeScaleMatrix(200.0));
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));
		gl.uniformMatrix4fv(program.NmatrixUniform, gl.FALSE, utils.identityMatrix());
		gl.uniform1i(program.textureUniform, 2);
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12);
		gl.uniform1i(program.textureUniform, 1);
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


		// draws the request
		gl.bindBuffer(gl.ARRAY_BUFFER, carMesh.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, carMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	    gl.bindBuffer(gl.ARRAY_BUFFER, carMesh.textureBuffer);
	    gl.vertexAttribPointer(program.textureCoordAttribute, carMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, carMesh.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, carMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, carMesh.indexBuffer);

		gl.uniform1i(program.textureUniform, 0);
		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 0.2);
		WVPmatrix = utils.multiplyMatrices(projectionMatrix, worldMatrix);
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));
		gl.uniformMatrix4fv(program.NmatrixUniform, gl.FALSE, utils.transposeMatrix(worldMatrix));
		gl.drawElements(gl.TRIANGLES, carMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		attitude();
		if (playing == true){
			displayAlt(carY,carLinVel);
			window.requestAnimationFrame(drawScene);
		}

}

function gameover(text){
	playing = false;
	var canvas = document.getElementById("msg");
	var ctx = canvas.getContext("2d");
	ctx.font = "30px Arial";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillText("You have crashed!", 10, 50);

}


function displayAlt(alt,vel){
	var canvas = document.getElementById("msg");
	var ctx = canvas.getContext("2d");
	//cxt.clearRect(0, 0, 200, 100);
	ctx.font = "30px Arial";
	ctx.color='grey';
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillText("Altitude: "+Math.round(alt*10)+" feet", 10, 50);
	ctx.fillText("Velocity: "+Math.round(-vel*100)+" knots", 10, 100);
}

function attitude(){
    var canvas = document.getElementById("attitude");
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#77FAF5";
    ctx.fillRect(0, 0, 200, 100);
    ctx.fillStyle = "#C78315";
    ctx.fillRect(0, 100, 200, 100);

    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.lineWidth = 3;
    var radius = 70;
    ctx.arc(100, 100, radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();
    ctx.closePath()



    ctx.beginPath()
    var radius = 150;
    var theta = utils.degToRad(roll);
    var pitchup = pitch+100;
    ctx.moveTo(pitchup, pitchup);
    ctx.lineTo(pitchup+radius*Math.cos(theta), pitchup+radius*Math.sin(theta));
    ctx.moveTo(pitchup, pitchup);
    ctx.lineTo(pitchup+radius*Math.cos(theta+Math.PI), pitchup+radius*Math.sin(theta+Math.PI));

    ctx.stroke();
    ctx.closePath()
    ctx.beginPath()

    ctx.lineWidth = 5;
    ctx.moveTo(80, 100);
    ctx.lineTo(120, 100);
    ctx.moveTo(90, 120);
    ctx.lineTo(110, 120);
    ctx.moveTo(90, 80);
    ctx.lineTo(110, 80);
    ctx.stroke();
    ctx.closePath()


    // color in the background
    //ctx.fillStyle = "#EEEEEE";
    //ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}