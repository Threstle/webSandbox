import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable } from './../types';

import planetFragmentShader from '../shaders/planet/planet.fs';
import planetVertexShader from '../shaders/planet/planet.vs';

export interface Rocket extends THREE.Mesh, Destroyable, Updatable {

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

    const material = new THREE.MeshBasicMaterial({color: 0xFF0000});
    const rocket = new THREE.Mesh(
        new THREE.BoxGeometry(10, 30, 1),
        material
    );

  
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
      console.log(e);
      if(e.code === 'Space'){
        acceleration+=0.1;
      }
      if(e.code === 'LeftArrow'){
        rocket.rotation.z += 0.01;  
      }
      if(e.code === 'RightArrow'){
        rocket.rotation.z -= 0.01;  
      }
    });

    const rocketWithUpdate = addFunction(rocket, 'update', (time:number) => {
        rocket.position.y += acceleration;
    });

    const rocketWithDestroy = addFunction(rocketWithUpdate, 'destroy', () => {
        // guiPlanet.destroy();
        rocket.geometry.dispose();
        rocket.material.dispose();
    });

    return rocketWithDestroy;
}
