/**
 * Created by Tom on 4/23/17.
 */
import * as THREE from 'three';
require('./firstPersonControls');
require('./waterShader');
require('./orbitControls');

/**
 * Water
 */

let water, materials, controls, renderer, scene, camera;

const parameters = {
	width: 2000,
	height: 2000,
	widthSegments: 250,
	heightSegments: 250,
	depth: 1500,
	param: 4,
	filterparam: 1
};

init();
animate();

function init() {

	// Renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild(renderer.domElement);

	// Scene
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xddaaaa, 0.00001);

	// Camera
	camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.5, 3000000);
	camera.position.set(2000, 750, 2000);

	// Controls
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.minDistance = 1000;
	controls.maxDistance = 5000;
	controls.maxPolarAngle = Math.PI * 0.495;
	controls.target.set(0, 500, 0);

	// Light
	scene.add(new THREE.AmbientLight(0x444444));
	const light = new THREE.DirectionalLight(0xffffbb, 1);
	light.position.set(0, 0 ,0);
	scene.add(light);

	// Water texture
	const waterNormal = require('./images/waternormals.jpg');
	const waterNormals = new THREE.TextureLoader().load(waterNormal);
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

	water = new (THREE as any).Water(renderer, camera, scene, {
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: waterNormals,
		alpha: 	1.0,
		sunDirection: light.position.clone().normalize(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 50.0,
		fog: scene.fog != undefined
	});

	const mirrorMesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(parameters.width * 500, parameters.height * 500),
		water.material,
	);

	mirrorMesh.add(water);
	mirrorMesh.rotation.x = - Math.PI * 0.5;
	scene.add(mirrorMesh);

	// Skybox
	const cubeMap = new THREE.CubeTexture([]);
	cubeMap.format = THREE.RGBFormat;

	const loader = new THREE.ImageLoader();
	const skyboxTexture = require('./images/skyboxsun5deg2.png');
	loader.load(skyboxTexture, image => {

		const getSide = (x, y) => {
			const size = 1024;
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;

			const context = canvas.getContext('2d');
			context.drawImage(image, -x * size, -y * size);

			return canvas;
		};

		cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
		cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
		cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
		cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
		cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
		cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
		cubeMap.needsUpdate = true;

	});


	const cubeShader = THREE.ShaderLib.cube;
	cubeShader.uniforms['tCube'].value = cubeMap;

	const skyBoxMaterial = new THREE.ShaderMaterial({
		fragmentShader: cubeShader.fragmentShader,
		vertexShader: cubeShader.vertexShader,
		uniforms: cubeShader.uniforms,
		depthWrite: false,
		side: THREE.BackSide,
	});

	const skybox = new THREE.Mesh(new THREE.BoxGeometry(1000000, 1000000, 1000000), skyBoxMaterial);
	console.log(skybox);
	scene.add(skybox);
	window.addEventListener( 'resize', onWindowResize, false );


}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	water.material.uniforms.time.value += 1.0 / 60.0;
	controls.update();
	water.render();
	renderer.render( scene, camera );
}




