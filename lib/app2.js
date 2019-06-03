var canvas;

var gl = null,
	program = null,
	planeMesh = null,
	planeWingsMesh = null,
	planeSphereMesh = null,
	planeMesh2 = null,
	grassMesh = {},
	ringMesh = {},
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

var NUM_RINGS = 10;
var ringColor = {}
var ringLocations = {};
var RingsCollected =0;
var RING_RADIUS = 50;
//Parameters for Camera
var cx = 4.5;
var cy = 5.0;
var cz = 10.0;
var pitch = 0.0;
var angle = 0.01;
var roll = 0.00;

var carX = 1000;
var carY = 500;
var carZ = 700;

var WORLDSCALEFACTOR=30.0;



var keys = [];
var vz = 0.0;
var vx = 0.0;
var vy = 0.0;
var rvy = 0.0;
var rvz = 0.0;
var rvx= 0.0;

var carLinVel = -2;

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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.Linear);
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
		planeTexture = new Image();
		planeTexture.txNum = 0;
		planeTexture.onload = textureLoaderCallback;
		planeTexture.src = PlaneTextureData;

		grassTexture = new Image();
		grassTexture.txNum = 1;
		grassTexture.onload = terrainLoaderCallback;
		grassTexture.src = GrassTextureData;

		treeTexture = new Image();
		treeTexture.txNum = 2;
		treeTexture.onload = textureLoaderCallback;
		treeTexture.src = TreeTextureData;


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

		//no image for bottom

		imgArray[3] = new Image();
		imgArray[3].txNum = 7;
		imgArray[3].onload = skyLoaderCallback;
		imgArray[3].src = SkyBackTextureData;

		imgArray[4] = new Image();
		imgArray[4].txNum = 8;
		imgArray[4].onload = skyLoaderCallback;
		imgArray[4].src = SkyFrontTextureData;

		heightmap = new Image();
		heightmap.onload = function(){
			gl.useProgram(program);
			planeMesh = new OBJ.Mesh(planeObjStr2);
			planeWingsMesh = new OBJ.Mesh(planeWingsObjStr);
			planeSphereMesh = new OBJ.Mesh(planeSphereObjStr);
			treeMesh = new OBJ.Mesh(treeObjStr);
			cloudySky = new OBJ.Mesh(skyObjStr);
			heightdata=getHeightData(this)
			grassGeometry = CreateTerrain(heightAtXZ);
			ringGeometry = CreateTorus();
			torusMesh = createTorus();
			var size = NUM_RINGS;
			while(size--) ringColor[size] = [1.0,0.843,0.0,1.0];
			// links mesh attributes to shader attributes
			program.vertexPositionAttribute = gl.getAttribLocation(program, "in_pos");
			gl.enableVertexAttribArray(program.vertexPositionAttribute);

			program.vertexNormalAttribute = gl.getAttribLocation(program, "in_norm");
			gl.enableVertexAttribArray(program.vertexNormalAttribute);

			program.textureCoordAttribute = gl.getAttribLocation(program, "in_uv");
			gl.enableVertexAttribArray(program.textureCoordAttribute);

			program.matrix = gl.getUniformLocation(program, "matrix");
			program.vertexMatrix = gl.getUniformLocation(program, "pMatrix");
			program.normalMatrix = gl.getUniformLocation(program, "nMatrix");
			program.textureUniform = gl.getUniformLocation(program, "u_texture");
			program.lightDir = gl.getUniformLocation(program, "lightDir");
		  program.lightColor = gl.getUniformLocation(program, 'lightColor');
		  program.materialDiffColor = gl.getUniformLocation(program, 'mDiffColor');
		  program.materialSpecColor = gl.getUniformLocation(program, 'mSpecColor');
		  program.materialSpecPower = gl.getUniformLocation(program, 'mSpecPower');
			program.ambPower = gl.getUniformLocation(program, 'ambPower');
			program.texturePower = gl.getUniformLocation(program, 'texturePower');
			program.materialColor = gl.getUniformLocation(program, 'materialColor');

			crashSound = new sound("res/Smashing.mp3");
			coinSound = new sound("res/coin.mp3");
			winSound = new sound("res/Winning.mp3");
			//create mash
			OBJ.initMeshBuffers(gl, treeMesh);
			OBJ.initMeshBuffers(gl, cloudySky);
			OBJ.initMeshBuffers(gl, planeMesh);
			OBJ.initMeshBuffers(gl, planeWingsMesh);
			OBJ.initMeshBuffers(gl, planeSphereMesh);
			grassMesh.vertices = CreateFloatBuffer(grassGeometry.vertices)
			grassMesh.textureCoords = CreateFloatBuffer(grassGeometry.textureCoords)
			grassMesh.normals = CreateFloatBuffer(grassGeometry.normals)
			grassMesh.indices = CreateIntBuffer(grassGeometry.indices)
			ringMesh.vertices = CreateFloatBuffer(ringGeometry.vertices)
			ringMesh.textureCoords = CreateFloatBuffer(ringGeometry.textureCoords)
			ringMesh.normals = CreateFloatBuffer(ringGeometry.normals)
			ringMesh.indices = CreateIntBuffer(ringGeometry.indices)


			// prepares the world, view and projection matrices.
			var w=canvas.clientWidth;
			var h=canvas.clientHeight;

			gl.clearColor(0.5, 0.5, 0.6, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.viewport(0.0, 0.0, w, h);

			aspectRatio = w/h;
			// turn on depth testing
			gl.enable(gl.DEPTH_TEST);

			// algin the skybox with the light

			CalcTreeAndRingLocations();
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
var Tfric = Math.log(0.25);
var sAS = 0.1;	// Not used yet
var mAS = 108.0;
var ASur = 1.0;	// Not used yet
var ASdr = 0.5;	// Not used yet

var carLinAcc = 0.0;

var preVz = 0;
var treeLocation = {}
var treeFieldSize = 40;

var currentPos= new Quaternion();
var angleX=0;
var angleY=90;
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
    //currentPos=rotationDirY;
		// call user procedure for world-view-projection matrices
		wvpMats = worldViewProjection(carX, carY, carZ, cx, cy, cz, aspectRatio,currentPos);


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
		carLinVel = (carLinVel * Math.exp(Tfric * deltaT) - deltaT * carLinAcc < -2 ?
			carLinVel * Math.exp(Tfric * deltaT) - deltaT * carLinAcc : -2);



		// Magic for moving the car
		worldMatrix = utils.multiplyMatrices(dvecmat, utils.MakeScaleMatrix(0.4));
		xaxis = [dvecmat[0],dvecmat[4],dvecmat[8]];
		yaxis = [dvecmat[1],dvecmat[5],dvecmat[9]];
		zaxis = [dvecmat[2],dvecmat[6],dvecmat[10]];


		cx = carX+2*Math.cos(-angleY*2-Math.PI/2);
		cy = carY+(pitch+25)*0.09;
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
			crashSound.play();
			gameover("You have crashed!");
		}
		if(unscaleX<-128 || unscaleX>128 || unscaleY<-128 || unscaleY>128){
			carX = 1000;
			carY = 1500;
		}

		var vwmatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
		var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, vwmatrix);
		var normalMatrix = utils.transposeMatrix(worldMatrix)

		var dirLightAlpha = -utils.degToRad(0);
		var dirLightBeta  = -utils.degToRad(120);

		var directionalLight = [0.0 , -0.5, -0.5]
		var directionalLightColor = [1.0, 1.0, 1.0];
		var materialDiffColor = [1.0, 1.0, 1.0];
		var specularColor = [0.0, 0.0, 0.0];
		var specularPower = 100.0;
		var ambPower = 0.2;


    gl.uniform3fv(program.lightColor,  directionalLightColor);
    gl.uniform3fv(program.lightDir,  directionalLight);
    gl.uniform1f(program.materialSpecPower, 100);
		gl.uniform1f(program.ambPower, 0.2);

		gl.uniform4fv(program.materialColor,  [1.0,0.843,0.0,1.0]);



		//draw cloudy sky
		gl.bindBuffer(gl.ARRAY_BUFFER, cloudySky.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, cloudySky.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, cloudySky.textureBuffer);
		gl.vertexAttribPointer(program.textureCoordAttribute, cloudySky.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, cloudySky.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, cloudySky.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cloudySky.indexBuffer);
		var worldMatrix1 = utils.MakeWorld(0, 0, 0, 0, 0, 0, 5000)
		vwmatrix1 = utils.multiplyMatrices(viewMatrix, worldMatrix1);
		projectionMatrix1 = utils.multiplyMatrices(perspectiveMatrix, vwmatrix1);
		normalMatrix1 = utils.invertMatrix(utils.identityMatrix());
		gl.uniform1i(program.textureUniform, 1);
		gl.uniform1f(program.texturePower, 1.0);
		gl.uniform3fv(program.materialDiffColor, [0.0, 0.0, 0.0]);
		gl.uniform3fv(program.materialSpecColor, [0.0, 0.0, 0.0]);
		gl.uniform3fv(program.lightColor, [0.0, 0.0, 0.0]);
		gl.uniform1f(program.ambPower, 1.0);
		gl.uniformMatrix4fv(program.vertexMatrix, gl.FALSE, utils.transposeMatrix(worldMatrix1));
		gl.uniformMatrix4fv(program.matrix, gl.FALSE, utils.transposeMatrix(projectionMatrix1));
		gl.uniformMatrix4fv(program.normalMatrix, gl.FALSE, utils.transposeMatrix(normalMatrix1));
		for (i=0; i < 6; i++){
			if(i != 3){ //don't draw bottom
				gl.uniform1i(program.textureUniform, 3+i);
				gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 2*i*6);
			}
		}

		gl.uniform1i(program.textureUniform, 1);
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 2*3*6);

		// draws the terrain
		gl.bindBuffer(gl.ARRAY_BUFFER, grassMesh.vertices);
		gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, grassMesh.textureCoords);
		gl.vertexAttribPointer(program.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, grassMesh.normals);
		gl.vertexAttribPointer(program.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassMesh.indices);
		var worldMatrix1 = utils.MakeWorld(0, 0, 0, 0, 0, 0, WORLDSCALEFACTOR)
		vwmatrix1 = utils.multiplyMatrices(viewMatrix, worldMatrix1);
		projectionMatrix1 = utils.multiplyMatrices(perspectiveMatrix, vwmatrix1);
		normalMatrix1 = utils.invertMatrix(utils.identityMatrix());
		gl.uniform3fv(program.materialDiffColor, [1.0, 1.0, 1.0]);
		gl.uniform3fv(program.lightColor,  directionalLightColor);
		gl.uniformMatrix4fv(program.vertexMatrix, gl.FALSE, utils.transposeMatrix(worldMatrix1));
		gl.uniformMatrix4fv(program.matrix, gl.FALSE, utils.transposeMatrix(projectionMatrix1));
		gl.uniformMatrix4fv(program.normalMatrix, gl.FALSE, utils.transposeMatrix(normalMatrix1));
		gl.uniform1i(program.textureUniform, 1);
		gl.uniform1f(program.ambPower, ambPower);
		gl.uniform3fv(program.materialSpecColor, [0.0, 0.0, 0.0]);
		gl.drawElements(gl.TRIANGLES, grassMesh.indices.numItems, gl.UNSIGNED_SHORT, 0);



		//draw trees
		gl.bindBuffer(gl.ARRAY_BUFFER, treeMesh.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, treeMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, treeMesh.textureBuffer);
		gl.vertexAttribPointer(program.textureCoordAttribute, treeMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, treeMesh.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, treeMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, treeMesh.indexBuffer);
		gl.uniform1i(program.textureUniform, 2);
		var treeScale = 25
		var smallTreeScale = 15
		var smallTreeDist = 2
		for(var i = 0; i < treeFieldSize; i+=1){
			for(var j = 0; j < treeFieldSize; j+=1){
				var x = treeLocation.x[i*treeFieldSize+j];
				var z = treeLocation.y[i*treeFieldSize+j];
				var y = heightAtXZ(x,z);
				//var y = 3* Math.sin(100*Math.PI * (x/1000)) * Math.sin(100*Math.PI * ((z/1000)));
				var worldMatrix1 = utils.MakeWorld(WORLDSCALEFACTOR*x, WORLDSCALEFACTOR*y, WORLDSCALEFACTOR*z, 0, 0, 0, treeScale)
				vwmatrix1 = utils.multiplyMatrices(viewMatrix, worldMatrix1);
				projectionMatrix1 = utils.multiplyMatrices(perspectiveMatrix, vwmatrix1);
				normalMatrix1 = utils.invertMatrix(utils.identityMatrix());
				gl.uniformMatrix4fv(program.vertexMatrix, gl.FALSE, utils.transposeMatrix(worldMatrix1));
				gl.uniformMatrix4fv(program.matrix, gl.FALSE, utils.transposeMatrix(projectionMatrix1));
				gl.uniformMatrix4fv(program.normalMatrix, gl.FALSE, utils.transposeMatrix(normalMatrix1));
				gl.drawElements(gl.TRIANGLES, treeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				if(treeLocation.neighbour[i*treeFieldSize+j] < 50){
					var y1 = heightAtXZ(x,z+smallTreeDist);
					var worldMatrix1 = utils.MakeWorld(WORLDSCALEFACTOR*x, WORLDSCALEFACTOR*y1, WORLDSCALEFACTOR*(z+smallTreeDist), 0, 0, 0, smallTreeScale*2)
					vwmatrix1 = utils.multiplyMatrices(viewMatrix, worldMatrix1);
					projectionMatrix1 = utils.multiplyMatrices(perspectiveMatrix, vwmatrix1);
					gl.uniformMatrix4fv(program.vertexMatrix, gl.FALSE, utils.transposeMatrix(worldMatrix1));
					gl.uniformMatrix4fv(program.matrix, gl.FALSE, utils.transposeMatrix(projectionMatrix1));
					gl.drawElements(gl.TRIANGLES, treeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
					y1 = heightAtXZ(x+smallTreeDist,z);
					var worldMatrix1 = utils.MakeWorld(WORLDSCALEFACTOR*(x+smallTreeDist), WORLDSCALEFACTOR*y1, WORLDSCALEFACTOR*z, 0, 0, 0, smallTreeScale*2)
					vwmatrix1 = utils.multiplyMatrices(viewMatrix, worldMatrix1);
					projectionMatrix1 = utils.multiplyMatrices(perspectiveMatrix, vwmatrix1);
					gl.uniformMatrix4fv(program.vertexMatrix, gl.FALSE, utils.transposeMatrix(worldMatrix1));
					gl.uniformMatrix4fv(program.matrix, gl.FALSE, utils.transposeMatrix(projectionMatrix1));
					gl.drawElements(gl.TRIANGLES, treeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}
			}
		}



		//draw ring

		gl.bindBuffer(gl.ARRAY_BUFFER, ringMesh.vertices);
		gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, ringMesh.textureCoords);
		gl.vertexAttribPointer(program.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, ringMesh.normals);
		gl.vertexAttribPointer(program.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ringMesh.indices);
		gl.uniform3fv(program.materialDiffColor, [0.0,0.0,0.0]);
		gl.uniform1f(program.materialSpecPower, 10);
		gl.uniform1f(program.texturePower, 0.0);
		gl.uniform1f(program.ambPower, 1.0);
		for(i=0; i<NUM_RINGS; i++){
			gl.uniform3fv(program.materialSpecColor, ringColor[i].slice(0,3));
			gl.uniform4fv(program.materialColor, ringColor[i]);
			var worldMatrix1 = utils.MakeWorld(ringLocations.x[i]*WORLDSCALEFACTOR, ringLocations.y[i]*WORLDSCALEFACTOR, ringLocations.z[i]*WORLDSCALEFACTOR, 0, ringLocations.angle[i], 0, RING_RADIUS)
			vwmatrix1 = utils.multiplyMatrices(viewMatrix, worldMatrix1);
			projectionMatrix1 = utils.multiplyMatrices(perspectiveMatrix, vwmatrix1);
			normalMatrix1 = utils.invertMatrix(utils.transposeMatrix(vwmatrix1));

			gl.uniformMatrix4fv(program.vertexMatrix, gl.FALSE, utils.transposeMatrix(worldMatrix1));
			gl.uniformMatrix4fv(program.matrix, gl.FALSE, utils.transposeMatrix(projectionMatrix1));
			gl.uniformMatrix4fv(program.normalMatrix, gl.FALSE, utils.transposeMatrix(normalMatrix1));
			gl.drawElements(gl.TRIANGLES, ringMesh.indices.numItems, gl.UNSIGNED_SHORT, 0);

		}


		// draws the request

		gl.uniform1f(program.materialSpecPower, 50);
		gl.bindBuffer(gl.ARRAY_BUFFER, planeWingsMesh.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, planeWingsMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, planeWingsMesh.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, planeWingsMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeWingsMesh.indexBuffer);
		gl.uniform4fv(program.materialColor,  [1.0,0.0,0.0,1.0]);
		gl.uniform3fv(program.materialDiffColor, [1.0,1.0,1.0]);
		gl.uniform3fv(program.materialSpecColor, [1.0,1.0,1.0]);
		gl.uniform1f(program.ambPower, 0.3);
		gl.uniformMatrix4fv(program.vertexMatrix, gl.FALSE, utils.transposeMatrix(worldMatrix));
		gl.uniformMatrix4fv(program.matrix, gl.FALSE, utils.transposeMatrix(projectionMatrix));
		gl.uniformMatrix4fv(program.normalMatrix, gl.FALSE, utils.transposeMatrix(normalMatrix));
		gl.drawElements(gl.TRIANGLES, planeWingsMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, planeSphereMesh.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, planeSphereMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, planeSphereMesh.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, planeSphereMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeSphereMesh.indexBuffer);
		gl.uniform4fv(program.materialColor,  [0.49804, 0.98039, 1.0,1.0]);
		gl.drawElements(gl.TRIANGLES, planeSphereMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);


		gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.vertexBuffer);
		gl.vertexAttribPointer(program.vertexPositionAttribute, planeMesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.textureBuffer);
		gl.vertexAttribPointer(program.textureCoordAttribute, planeMesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, planeMesh.normalBuffer);
		gl.vertexAttribPointer(program.vertexNormalAttribute, planeMesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeMesh.indexBuffer);
		gl.uniform1f(program.texturePower, 1.0);
		gl.uniform1i(program.textureUniform, 0);
		gl.drawElements(gl.TRIANGLES, planeMesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		attitude();
		IsPlaneWithinRing();
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
	ctx.fillText(text, 10, 50);

}




function displayAlt(alt,vel){
	var canvas = document.getElementById("msg");
	var ctx = canvas.getContext("2d");
	ctx.font = "30px Arial";
	ctx.color='grey';
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	alt = alt*10;
	vel = -vel*40;
	ctx.fillText("Altitude: "+Math.round(alt)+" feet", 10, 50);
	ctx.fillText("Velocity: "+Math.round(vel)+" knots", 10, 100);
	ctx.fillText("Rings Collected: "+RingsCollected+"/10", 10, 150);

	if(RingsCollected==NUM_RINGS){
		playing=false;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillText("YOU WIN!!", 10, 50);
		winSound.play()

	}
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


	return ((1-z+z_)*(1-x+x_)*heightAtXZ(x_,z_)+(1-z+z_)*(x-x_)*heightAtXZ(x_+1,z_)+
		(z-z_)*(1-x+x_)*heightAtXZ(x_,z_+1)+(z-z_)*(x-x_)*heightAtXZ(x_+1,z_+1));
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
	for (i=0; i<treeLocation.y.length; i++){
		if(treeLocation.y[i]==z_&&treeLocation.x[i]==x_){
			xFound=true;
			break;
		}



	}

	if( xFound  && y<heightAtXZ(x,z)+TREEHEIGHT){
		crashSound.play()
		gameover("You have crashed into a tree!");
	}

}

function CreateFloatBuffer(array){
	var buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
	return buf
}

function CreateIntBuffer(array){
	var buf = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(array), gl.STATIC_DRAW);
	buf.numItems = array.length;
	return buf
}

function CalcTreeAndRingLocations(){
	treeLocation.x = {}
	treeLocation.y = {}
	treeLocation.neighbour = {}
	for(var i = 0; i < treeFieldSize; i+=1){
		for(j = 0; j < treeFieldSize; j+=1){
			treeLocation.x[i*treeFieldSize+j]=Math.round(-128+256*Math.random()+1);
			treeLocation.y[i*treeFieldSize+j]=Math.round(-128+256*Math.random()+1);
			treeLocation.neighbour[i*treeFieldSize+j]=Math.floor(Math.random() * 110);
		}
	}

	ringLocations.x = {}
	ringLocations.z = {}
	ringLocations.y = {}
	ringLocations.angle = {}

	for(var i = 0; i < NUM_RINGS; i+=1){
		ringLocations.x[i]=Math.round(-100+200*Math.random()+1);
		ringLocations.z[i]=Math.round(-100+200*Math.random()+1);
		ringLocations.angle[i]=2*Math.PI*i/NUM_RINGS;
		ringLocations.y[i]=heightAtXZ(ringLocations.x[i],ringLocations.z[i])+10+20*Math.random();
	}

}

function IsPlaneWithinRing(){
	for(var i = 0; i < NUM_RINGS; i+=1) {
		if((Math.sqrt(Math.pow((ringLocations.x[i]*WORLDSCALEFACTOR-carX),2)+
			Math.pow((ringLocations.y[i]*WORLDSCALEFACTOR-carY),2)+
			Math.pow((ringLocations.z[i]*WORLDSCALEFACTOR-carZ),2))<RING_RADIUS) && (ringColor[i][1]!=0.7529)){
			RingsCollected+=1;
			coinSound.play()
			ringColor[i]=[0.7529, 0.7529, 0.7529, 1];
		}
	}
}

function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}
