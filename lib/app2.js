var canvas;

var gl = null,
	program = null,
	carMesh = null,
	skybox = null,
	imgtx = null,
	skyboxLattx = null,
	skyboxTbtx = null,
	heightmap = null,
	torusMesh=null;

var heightdata = null;

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
var carX = 1000;
var carY = 500;
var carZ = 700;

var WORLDSCALEFACTOR=20.0;


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

		gl.clearColor(0.5, 0.5, 0.6, 1.0);
		// Clear the context with the newly set color. This is
		// the function call that actually does the drawing.
		gl.clear(gl.COLOR_BUFFER_BIT);
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
uniform int isSky;

out vec4 color;
void main() {
	vec4 texcol = texture(u_texture, fs_uv);
	if(isSky == 0){
		float ambFact = lightDir.w;
		float dimFact = (1.0-ambFact) * clamp(dot(normalize(fs_norm), lightDir.xyz),0.0,1.0) + ambFact;
		color = vec4(texcol.rgb * dimFact, texcol.a);
	}
	else{
		color = vec4(texcol.rgb, texcol.a);
	}

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

var terrainLoaderCallback = function() {
	var textureId = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + this.txNum);
	gl.bindTexture(gl.TEXTURE_2D, textureId);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
	gl.generateMipmap(gl.TEXTURE_2D)
// set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

var skyLoaderCallback = function() {
	var textureId = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0 + this.txNum);
	gl.bindTexture(gl.TEXTURE_2D, textureId);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
// set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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



		// Create the textures



		imgtx = new Image();
		imgtx.txNum = 0;
		imgtx.onload = textureLoaderCallback;
		imgtx.src = CarTextureData;

		skyboxLattx = new Image();
		skyboxLattx.txNum = 1;
		skyboxLattx.onload = terrainLoaderCallback;
		skyboxLattx.src = TrackTextureData;
		treetx = new Image();
		treetx.txNum = 2;
		treetx.onload = terrainLoaderCallback;
		treetx.src = TreeTextureData;


		var imgArray = new Array();
		imgArray[0] = new Image();
		imgArray[0].txNum = 3;
		imgArray[0].onload = skyLoaderCallback;
		imgArray[0].src = SkyRightTextureData;

		imgArray[1] = new Image();
		imgArray[1].txNum = 4;
		imgArray[1].onload = skyLoaderCallback;
		imgArray[1].src = SkyLeftTextureData;

		imgArray[2] = new Image();
		imgArray[2].txNum = 5;
		imgArray[2].onload = skyLoaderCallback;
		imgArray[2].src = SkyTopTextureData;

		imgArray[3] = new Image();
		imgArray[3].txNum = 7;
		imgArray[3].onload = skyLoaderCallback;
		imgArray[3].src = SkyBackTextureData;

		imgArray[4] = new Image();
		imgArray[4].txNum = 8;
		imgArray[4].onload = skyLoaderCallback;
		imgArray[4].src = SkyFrontTextureData;


		// Load mesh using the webgl-obj-loader library

		heightmap = new Image();
		heightmap.onload = function(){
			gl.useProgram(program);
			carMesh = new OBJ.Mesh(carObjStr);
			carMesh.materialIndices = [1.0, 1.0, 1.0]
			treeMesh = new OBJ.Mesh(treeObjStr);
			heightdata=getHeightData(this)
			skybox = CreateTerrain(heightAtXZ);
			cloudySky = new OBJ.Mesh(skyObjStr);
			torusMesh = createTorus();
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
			program.isSky = gl.getUniformLocation(program, "isSky");

			OBJ.initMeshBuffers(gl, carMesh);
			OBJ.initMeshBuffers(gl, treeMesh);
			OBJ.initMeshBuffers(gl, cloudySky);

			// prepares the world, view and projection matrices.
			var w=canvas.clientWidth;
			var h=canvas.clientHeight;

			gl.clearColor(0.5, 0.5, 0.6, 1.0);
			// Clear the context with the newly set color. This is
			// the function call that actually does the drawing.
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.viewport(0.0, 0.0, w, h);

//		perspectiveMatrix = utils.MakePerspective(60, w/h, 0.1, 1000.0);
			aspectRatio = w/h;

			// turn on depth testing
			gl.enable(gl.DEPTH_TEST);


			// algin the skybox with the light
			gLightDir = [-1.0, 0.0, 0.0, 0.0];
			skyboxWM = utils.multiplyMatrices(utils.MakeRotateZMatrix(30), utils.MakeRotateYMatrix(135));
			gLightDir = utils.multiplyMatrixVector(skyboxWM, gLightDir);


			for(var i = 0; i < treeFieldSize; i+=1){
				for(j = 0; j < treeFieldSize; j+=1){
					treeLocationx[i*treeFieldSize+j]=Math.round(-128+256*Math.random()+1);
					treeLocationy[i*treeFieldSize+j]=Math.round(-128+256*Math.random()+1);
					treeNeighbour[i*treeFieldSize+j]=Math.floor(Math.random() * 110);
				}
			}
			drawScene();
		}
		heightmap.src=hmapB64;


}else{
	alert("Error: WebGL not supported by your browser!");
}
}

var lastUpdateTime;
var fSk = 500.0;

// Driving dynamic coefficients
var sAT = 0.5;
var mAT = 5.0;
var ATur = 3.0;
var ATdr = 5.5;
var sBT = 1.0;
var mBT = 3.0;
var BTur = 5.0;
var BTdr = 5.5;
var Tfric = Math.log(0.15);
var sAS = 0.1;	// Not used yet
var mAS = 108.0;
var ASur = 1.0;	// Not used yet
var ASdr = 0.5;	// Not used yet

var carLinAcc = 0.0;

var preVz = 0;
var treeLocationx =[]
var treeLocationy =[]
var treeNeighbour = []
var treeFieldSize = 40;

var currentPos= new Quaternion();
var angleX=0;
var angleY=180;
var angleZ=0;
function drawScene() {
		// compute time interval
		// Clear the context with the newly set color. This is
		// the function call that actually does the drawing.
		gl.clear(gl.COLOR_BUFFER_BIT);
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

    angleX=utils.degToRad(pitch);
    Rrvy=utils.degToRad(rvy);
    angleZ=utils.degToRad(roll);
    angleY+=Rrvy;

    var rotationDirX = new Quaternion(Math.cos(angleX), Math.sin(angleX), 0, 0);
    var rotationDirY = new Quaternion(Math.cos(angleY), 0, Math.sin(angleY), 0);
    var rotationDirZ = new Quaternion(Math.cos(angleZ), 0, 0, Math.sin(angleZ));

    currentPos= rotationDirY.mul(rotationDirX.mul(rotationDirZ));
		// call user procedure for world-view-projection matrices
		wvpMats = worldViewProjection(carX, carY, carZ, carAngle, cx, cy, cz, aspectRatio,currentPos);


		viewMatrix = wvpMats[1];

		perspectiveMatrix = wvpMats[2];

		dvecmat = wvpMats[0];

		// computing car velocities


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
		carLinVel = (carLinVel * Math.exp(Tfric * deltaT) - deltaT * carLinAcc < -0.5 ?
			carLinVel * Math.exp(Tfric * deltaT) - deltaT * carLinAcc : -0.5);



		// Magic for moving the car
		worldMatrix = utils.multiplyMatrices(dvecmat, utils.MakeScaleMatrix(0.1));
		xaxis = [dvecmat[0],dvecmat[4],dvecmat[8]];
		yaxis = [dvecmat[1],dvecmat[5],dvecmat[9]];
		zaxis = [dvecmat[2],dvecmat[6],dvecmat[10]];


		cx = carX+2*Math.cos(-angleY*2-Math.PI/2);
		cy = carY+(pitch+30)*0.03;
		cz = carZ+2*Math.sin(-angleY*2-Math.PI/2);
		// car motion
		delta = utils.multiplyMatrixVector(dvecmat, [0, 0, carLinVel, 0.0]);
		carX -= delta[0];
		carZ -= delta[2];
		carY-=delta[1];

		isThereATreeHere();
		//we have crashed!
		unscaleX=carX/WORLDSCALEFACTOR;
		unscaleY=carY/WORLDSCALEFACTOR;
		unscaleZ=carZ/WORLDSCALEFACTOR;
		if(unscaleY<heightAtXZ(unscaleX,unscaleZ)+0.5){
			gameover("You have crashed!");

		}
		if(unscaleX<-128 || unscaleX>128 || unscaleY<-128 || unscaleY>128){
			carX = 1000;
			carY = 1500;
		}


		projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewMatrix);
		gl.uniform1i(program.isSky, 1);
		//draw cloudy sky
		gl.bindBuffer(gl.ARRAY_BUFFER, cloudySky.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, cloudySky.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, cloudySky.textureBuffer);
		gl.vertexAttribPointer(program.textureCoordAttribute, cloudySky.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, cloudySky.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, cloudySky.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloudySky.indexBuffer);

		gl.uniform1i(program.textureUniform, 1);
		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 0.2);
		gl.uniformMatrix4fv(program.NmatrixUniform, gl.FALSE, utils.identityMatrix());
		WVPmatrix1 = utils.multiplyMatrices(projectionMatrix,utils.MakeScaleMatrix(250));
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix1));

		for (i=0; i < 6; i++){
			//if(i != 4){
				gl.uniform1i(program.textureUniform, 3+i);
				gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 2*i*6);
			//}
		}

		gl.uniform1i(program.isSky, 0);
		// draws the terrain
		var buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skybox.vertices), gl.STATIC_DRAW);
		gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		var texturesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, texturesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skybox.textureCoords), gl.STATIC_DRAW);
		gl.vertexAttribPointer(program.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

		var normalsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skybox.normals), gl.STATIC_DRAW);
		gl.vertexAttribPointer(program.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

		var indicesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
		var indices = new Uint16Array(skybox.indices)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 0.1);
		WVPmatrix = utils.multiplyMatrices(projectionMatrix,utils.MakeScaleMatrix(WORLDSCALEFACTOR));
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));
		gl.uniformMatrix4fv(program.NmatrixUniform, gl.FALSE, utils.identityMatrix());
		//gl.uniform1i(program.textureUniform, 2);
		//gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12);
		gl.uniform1i(program.textureUniform, 1);
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);




		gl.bindBuffer(gl.ARRAY_BUFFER, treeMesh.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, treeMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, treeMesh.textureBuffer);
		gl.vertexAttribPointer(program.textureCoordAttribute, treeMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, treeMesh.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, treeMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeMesh.indexBuffer);

		gl.uniform1i(program.textureUniform, 2);
		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 0.2);
		gl.uniformMatrix4fv(program.NmatrixUniform, gl.FALSE, utils.identityMatrix());
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix));
		gl.drawElements(gl.TRIANGLES, treeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		for(var i = 0; i < treeFieldSize; i+=1){
			for(var j = 0; j < treeFieldSize; j+=1){
				var x = treeLocationx[i*treeFieldSize+j];
				var z = treeLocationy[i*treeFieldSize+j];
				var y = heightAtXZ(x,z);
				//var y = 3* Math.sin(100*Math.PI * (x/1000)) * Math.sin(100*Math.PI * ((z/1000)));
				WVPmatrix1 = utils.multiplyMatrices(WVPmatrix,utils.MakeTranslateMatrix(x, y, z));
				gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix1));
				gl.drawElements(gl.TRIANGLES, treeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				if(treeNeighbour[i*treeFieldSize+j] < 5){
					WVPmatrix1 = utils.multiplyMatrices(WVPmatrix1,utils.MakeScaleMatrix(0.7));
					WVPmatrix2 = utils.multiplyMatrices(WVPmatrix1,utils.MakeTranslateMatrix(0, 0, 2));
					gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix2));
					gl.drawElements(gl.TRIANGLES, treeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
					WVPmatrix3 = utils.multiplyMatrices(WVPmatrix1,utils.MakeTranslateMatrix(2, 0, 0));
					gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(WVPmatrix3));
					gl.drawElements(gl.TRIANGLES, treeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}
			}
		}
		//draw tori

		var torVertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, torVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(torusMesh.vertices), gl.STATIC_DRAW);
		gl.vertexAttribPointer(program.textureCoordAttribute, torVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		var torTexturesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, torTexturesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(torusMesh.textureCoords), gl.STATIC_DRAW);
		gl.vertexAttribPointer(program.textureCoordAttribute, torTexturesBuffer.itemSize, gl.FLOAT, false, 0, 0);

		var torNormalsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, torNormalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(torusMesh.normals), gl.STATIC_DRAW);
		gl.vertexAttribPointer(program.textureCoordAttribute, torNormalsBuffer.itemSize, gl.FLOAT, false, 0, 0);

		var torIndicesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, torIndicesBuffer);
		var torIndices = new Uint16Array(torusMesh.indices)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, torIndices, gl.STATIC_DRAW);
		gl.vertexAttribPointer(program.textureCoordAttribute, torIndicesBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.uniform4f(program.lightDir, gLightDir[0], gLightDir[1], gLightDir[2], 0.1);
		tWVPmatrix = utils.multiplyMatrices(projectionMatrix,utils.MakeScaleMatrix(10));
		gl.uniformMatrix4fv(program.WVPmatrixUniform, gl.FALSE, utils.transposeMatrix(tWVPmatrix));
		gl.uniformMatrix4fv(program.NmatrixUniform, gl.FALSE, utils.identityMatrix());
		gl.uniform1i(program.textureUniform, 0);
		gl.drawElements(gl.TRIANGLES, torIndices.length, gl.UNSIGNED_SHORT, 0);


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
	//playing = false;
	var canvas = document.getElementById("msg");
	var ctx = canvas.getContext("2d");
	ctx.font = "30px Arial";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillText(text, 10, 50);

}




function displayAlt(alt,vel){
	var canvas = document.getElementById("msg");
	var ctx = canvas.getContext("2d");
	//cxt.clearRect(0, 0, 200, 100);
	ctx.font = "30px Arial";
	ctx.color='grey';
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	alt = alt*10;
	vel = -vel*40;
	ctx.fillText("Altitude: "+Math.round(alt)+" feet", 10, 50);
	ctx.fillText("Velocity: "+Math.round(vel)+" knots", 10, 100);
    disalt(alt);
    disvel(vel);
}

function disalt(alt){
    var canvas = document.getElementById("alt");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.lineWidth = 3;
    var radius = 85;
    ctx.arc(100, 100, radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();
    ctx.closePath();

    ctx.font = "15px Arial";
    ctx.fillText("Altitude", 75, 50);
    ctx.fillText("0", 96, 30);
    ctx.fillText("5", 96, 180);

    ctx.beginPath();
    radius = 78;
    var hundreds = alt%1000;
    var thetaHundreds = Math.PI*2*hundreds/1000-Math.PI/2;
    var theta =Math.PI*2*alt/10000-Math.PI/2;
    var center=100;
    ctx.moveTo(center, center);
    ctx.lineTo(center+radius*Math.cos(theta), center+radius*Math.sin(theta));
    radius = 65;
    ctx.moveTo(center, center);
    ctx.lineTo(center+radius*Math.cos(thetaHundreds), center+radius*Math.sin(thetaHundreds));

    ctx.stroke();
    ctx.closePath();

}

function disvel(vel){
    var canvas = document.getElementById("vel");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.lineWidth = 3;
    var radius = 85;
    ctx.arc(100, 100, radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();
    ctx.closePath();

    ctx.font = "15px Arial";
    ctx.fillText("Velocity", 75, 50);
    ctx.fillText("0", 96, 30);
    ctx.fillText("100", 90, 180);
    ctx.fillText("50", 165, 105);
    ctx.fillText("150", 20, 105);

    ctx.beginPath();
    radius = 60;
    var theta =Math.PI*2*vel/200-Math.PI/2;
    var center=100;
    ctx.moveTo(center, center);
    ctx.lineTo(center+radius*Math.cos(theta), center+radius*Math.sin(theta));


    ctx.stroke();
    ctx.closePath();

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

}

var heightAtXZ = function (x,z){
	//returns the height at a point according to the heightmap
	//performs linear interpolation on the heightmap

	if(x<-128 || z<	-128 || x>128 || z>128)
		return 0.0;

	var x_ = Math.floor(x);
	var z_ = Math.floor(z);

	if(x==x_ && z==z_)
		return heightdata[(x_+128)*256+(z_+128)]*5-50;


	return (1-z+z_)*(1-x+x_)*heightAtXZ(x_,z_)+(1-z+z_)*(x-x_)*heightAtXZ(x_+1,z_)+
		(z-z_)*(1-x+x_)*heightAtXZ(x_,z_+1)+(z-z_)*(x-x_)*heightAtXZ(x_+1,z_+1);

};

var TREEHEIGHT=2;
function isThereATreeHere(){

	x=carX/WORLDSCALEFACTOR;
	y=carY/WORLDSCALEFACTOR;
	z=carZ/WORLDSCALEFACTOR
	x_=Math.round(x);
	z_=Math.round(z);

	if(Math.abs(x-x_)>0.3 || Math.abs(z-z_)>0.3)
		return;

	var xFound= false;
	for (i=0; i<treeLocationy.length; i++){
		if(treeLocationy[i]==z_&&treeLocationx[i]==x_){
			xFound=true;
			break;
		}



	}

	if( xFound  && y<heightAtXZ(x,z)+TREEHEIGHT)
		gameover("You have crashed into a tree!");

}
