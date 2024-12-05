import * as CANNON from 'cannon';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable } from './../types';

export interface Rocket extends Destroyable, Updatable {
  mesh:THREE.Mesh;
  setPosition(x:number,y:number):void;
  body:CANNON.Body;
};


export interface RocketParams {
  acceleration?: number;
}

const defaultParams: RocketParams = {
  acceleration: 0.1
}

export function createRocket(
  params?: RocketParams,
  gui = container.resolve<GUI>("GUI")
): Rocket {

  const sanitizedParams = { ...defaultParams, ...params };
  let {
    acceleration
  } = sanitizedParams;

  // Create the material
  // const material = new THREE.ShaderMaterial({
  //     vertexShader: planetVertexShader,
  //     fragmentShader: planetFragmentShader,
  //     uniforms:{
  //         uSeed: { value: Math.random()*1000.0 },
  //         uColor1: { value: new THREE.Color(color1) },
  //         uColor2: { value: new THREE.Color(color2) },
  //         uNoiseScale: { value: noiseScale  },
  //         uContinentsScale: { value: continentsScale },
  //         uMountainsSize: { value: mountainsSize}
  //     }
  // });

  const material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(20, 60, 1),
    material
  );


  const body = new CANNON.Body({ mass: 1 });

  // body.angularVelocity.z = 1;
  // const guiParams = {
  //     scale:planet.scale.x,
  //     rotationSpeed
  // }

  // const guiPlanet = gui.addFolder(name || "Planet");
  // guiPlanet.add(planet.position, 'x', -1000, 1000);
  // guiPlanet.add(planet.position, 'y', -1000, 1000);
  // guiPlanet.add(guiParams, 'rotationSpeed', -1, 1).onChange((value:number) => {rotationSpeed = value});


  // const guiMaterial = guiPlanet.addFolder('Material');
  // guiMaterial.add(material.uniforms.uNoiseScale, 'value', 0, 10).name('Noise Scale').onChange((value:number) => {
  //     material.uniforms.uNoiseScale.value = value;
  // });
  // guiMaterial.add(material.uniforms.uContinentsScale, 'value', 0, 10).name('Continents Scale').onChange((value:number) => {
  //     material.uniforms.uContinentsScale.value = value;
  // });
  // guiMaterial.add(material.uniforms.uMountainsSize, 'value', 0, 120).name('Mountains Size').onChange((value:number) => {
  //     material.uniforms.uMountainsSize.value = value;
  // });

  // guiPlanet.add(guiParams, 'scale', 0.01, 10).onChange((value:number) => {
  //     planet.scale.set(value, value, value);
  // })
  // guiPlanet.close();

  // const atmosphere = createAtmosphere(radius + 10,guiPlanet, atmosphereParams);
  // // planet.add(atmosphere);

  // const planetWithUpdate = addFunction(planet, 'update', (time:number) => {
  //     planet.rotation.y += rotationSpeed;
  //     atmosphere.rotation.y -= 0.005;
  //     atmosphere.material.uniforms.uTime.value = time;
  // });

  // const planetWithDestroy = addFunction(planetWithUpdate, 'destroy', () => {
  //     guiPlanet.destroy();
  //     planet.geometry.dispose();
  //     planet.material.dispose();
  // });

  document.addEventListener('keydown', (e) => {
    // console.log(e.code);
    if (e.code === 'ArrowUp') {
      // console.log(body.velocity)
      const forward = new THREE.Vector3(0,1,0);
      // mesh.getWorldDirection(forward);

      const rot = mesh.rotation.z;

      const rotatedVector = {
        x: forward.x * Math.cos(rot) - forward.y * Math.sin(rot),
        y: forward.x * Math.sin(rot) + forward.y * Math.cos(rot),
      };

      
      body.velocity.x += rotatedVector.x;
      body.velocity.y += rotatedVector.y;
      console.log(forward);

      // forward.applyQuaternion(mesh.quaternion);
      // console.log(forward,mesh.quaternion)
      // body.velocity.x += 10.1;
    }
    if (e.code === 'ArrowLeft') {
      body.angularVelocity.z += 0.1;
    }
    if (e.code === 'ArrowRight') {
      body.angularVelocity.z -= 0.1;
    }
  });

  const updatePositionFromBody = ()=>{
    mesh.position.set(body.position.x, body.position.y, mesh.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  }

  const base = {
    mesh,
    body,
  }

  const rocketWithUpdate = addFunction(base, 'update', (time: number) => {
    updatePositionFromBody();
    // console.log(body.angularVelocity.z);
  });

  const rocketWithDestroy = addFunction(rocketWithUpdate, 'destroy', () => {
    // guiPlanet.destroy();
    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  const rocketWithSetPos = addFunction(rocketWithDestroy,'setPosition',(x:number,y:number)=>{
    body.position.set(x,y,0);
    updatePositionFromBody();
  });


  return rocketWithSetPos;
}
