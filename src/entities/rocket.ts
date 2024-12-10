import * as CANNON from 'cannon';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';

export interface Rocket extends Destroyable, Updatable {
  mesh: THREE.Mesh;
  setPosition(x: number, y: number): void;
  body: CANNON.Body;
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
    new THREE.BoxGeometry(50, 100, 1),
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

  let velocity = 0;

  const getForwardVector = (rotation: number) => {
    return new THREE.Vector3(
      Math.cos(rotation),
      Math.sin(rotation),
    )
  }

  const updateRigidbodyVelocity = ()=>{

    const rotatedVector = getForwardVector(mesh.rotation.z);

    body.velocity.set(
      body.velocity.x + -rotatedVector.y * velocity,
      body.velocity.y + rotatedVector.x * velocity,
      body.velocity.z
    )
    
    body.velocity.x -= 1 * (body.velocity.x>0?1:-1)
    body.velocity.y -= 1 * (body.velocity.y>0?1:-1)


  }

  const addVelocity = (amount:number)=>{
    velocity += amount;
    if(velocity>10){velocity=10};
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
      addVelocity(5);
    }
    if (e.code === 'ArrowLeft') {
      body.angularVelocity.z += 0.3;
    }
    if (e.code === 'ArrowRight') {
      body.angularVelocity.z -= 0.3;
    }
    if (e.code === 'ArrowDown') {
      if(velocity>0){
        addVelocity(-5);
      }
    }
  });

  const getRotatedVector = (forward: THREE.Vector3) => {
    const rot = mesh.rotation.z;

    const rotatedVector = {
      x: forward.x * Math.cos(rot) - forward.y * Math.sin(rot),
      y: forward.x * Math.sin(rot) + forward.y * Math.cos(rot),
    };

    return rotatedVector;
  }

  const updatePositionFromBody = () => {
    mesh.position.set(body.position.x, body.position.y, mesh.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  }

  const base = {
    mesh,
    body,
  }

  let lastTimestamp = 0;
  const rocketWithUpdate = addFunction(base, 'update', (time: number) => {

    if (time - lastTimestamp > 50) {
      lastTimestamp = time;
      console.log('top');

      if (body.angularVelocity.z !== 0) {
        body.angularVelocity.z -= 0.01 * (body.angularVelocity.z > 0 ? 1 : -1);
      }
      
      velocity-=1;
      
      if(velocity<0)velocity=0;

  
      updateRigidbodyVelocity(); 
     
    }

    updatePositionFromBody();

    // console.log(body.angularVelocity.z);
  });

  const rocketWithDestroy = addFunction(rocketWithUpdate, 'destroy', () => {
    // guiPlanet.destroy();
    mesh.geometry.dispose();
    mesh.material.dispose();
  });

  const rocketWithSetPos = addFunction(rocketWithDestroy, 'setPosition', (x: number, y: number) => {
    body.position.set(x, y, 0);
    updatePositionFromBody();
  });


  return rocketWithSetPos;
}
