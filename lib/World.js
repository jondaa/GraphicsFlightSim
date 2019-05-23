// these global variables are used to contain the current angles of the world


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

