function worldViewProjection(carx, cary, carz, cardir, camx, camy, camz, aspectRatio, currentPos) {
// Computes the world, view and projection matrices for the game.

// carx, cary and carz encodes the position of the car.
// Since the game is basically in 2D, camdir contains the rotation about the y-axis to orient the car

// The camera is placed at position camx, camy and camz. The view matrix should be computed using the
// LookAt camera matrix procedure, with the correct up-vector.

// The projection matrix is perspective projection matrix, with the aspect ratio written in parameter
// aspectRatio, a vertical Fov-y of 60 degrees, and with near and far planes repsectively at 0.1 and 1000.0

	var T = [1,0,0,carx,
				0,1,0,cary,
				0,0,1,carz,
				0,0,0,1];

	var world =  utils.multiplyMatrices(T,currentPos.toMatrix4());


	var u = [0,1,0];
	var a = [carx,cary,carz];
	var c = [camx,camy,camz];
	var vz = utils.normalizeVector3([c[0]-a[0],c[1]-a[1],c[2]-a[2]]);
	var vx = utils.normalizeVector3(utils.crossVector(u,vz));
	var vy = utils.crossVector(vz,vx);
	var viewinv  = [vx[0],vy[0],vz[0],c[0],
				vx[1],vy[1],vz[1],c[1],
				vx[2],vy[2],vz[2],c[2],
				0,0,0,1];
	var view = utils.invertMatrix(viewinv);
	var projection = [1/(aspectRatio*Math.tan(Math.PI/6)), 0, 0, 0,
						0, 1/(Math.tan(Math.PI/6)), 0, 0,
						0, 0, 5000.1/(0.1-5000), 2*0.1*5000/-4999.9,
						0, 0, -1, 0];

	return [world, view, projection];
}




// this function returns the world matrix with the updated rotations.
// parameters rvx, rvy and rvz contains a value in the -1 .. +1 range that tells the angular velocity of the world.
function updateWorld(rvx, rvy, rvz) {


	Rrvx=utils.degToRad(rvx);
	Rrvy=utils.degToRad(rvy);
	Rrvz=utils.degToRad(rvz);


	var rotationDirX = new Quaternion(Math.cos(Rrvx), Math.sin(Rrvx), 0, 0);
	var rotationDirY = new Quaternion(Math.cos(Rrvy), 0, Math.sin(Rrvy), 0);
	var rotationDirZ = new Quaternion(Math.cos(Rrvz), 0, 0, Math.sin(Rrvz));

	currentPos= rotationDirX.mul(rotationDirY.mul(rotationDirZ.mul(currentPos)));

	return currentPos;
}
