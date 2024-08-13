import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable } from './../types';

import standardVertexShader from '../shaders/standard/standard.vs';
import planetFragmentShader from '../shaders/planet/planet.fs';
import atmosphereFragmentShader from '../shaders/atmosphere/atmosphere.fs';

export interface Planet extends THREE.Mesh, Destroyable, Updatable {

 };

interface AtmosphereParams {
    speed?: number;
    thickness?: number;
    noiseScale?: number;
}

export interface PlanetParams {
    name?: string;
    color?: number;
    widthSegment?: number;
    heightSegment?: number;
    continentsScale?: number;
    noiseScale?: number;
    atmosphereParams?:AtmosphereParams
}

const defaultParams: PlanetParams = {
    name: "Anonymous Planet",
    color: 0xFF00F0,
    widthSegment: 32,
    heightSegment: 32,
    continentsScale: 1.49,
    noiseScale: 1.1,
    atmosphereParams:{
        speed: 0.001,
        thickness: 20,
        noiseScale: 1.1
    }
}

function createAtmosphere(radius: number,gui:GUI, params?:AtmosphereParams, ) {

    const sanitizedParams = { ...defaultParams.atmosphereParams, ...params };
    const { speed, thickness, noiseScale } = sanitizedParams;
    // Create the material
    const material = new THREE.ShaderMaterial({
        vertexShader: standardVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms:{
            uTime: { value: 0  },
            uSpeed:{ value: speed },
            uThickness: { value: thickness },
            uNoiseScale: { value: noiseScale },
        }
    });
    material.transparent = true;

    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 32),
        material
    );

    const guiAtmosphere = gui.addFolder('Atmosphere');

    guiAtmosphere.add(material.uniforms.uSpeed, 'value', 0, 10).name('Speed').onChange((value:number) => {
        material.uniforms.uSpeed.value = value;
    });
    guiAtmosphere.add(material.uniforms.uThickness, 'value', 0, 100).name('Thickness').onChange((value:number) => {
        material.uniforms.uThickness.value = value;
    });
    guiAtmosphere.add(material.uniforms.uNoiseScale, 'value', 0, 10).name('Noise Scale').onChange((value:number) => {
        material.uniforms.uNoiseScale.value = value;
    });


    return atmosphere
}

export function createPlanet(
    radius: number,
    params?: PlanetParams,
    gui = container.resolve<GUI>("GUI")
): Planet {

    const sanitizedParams = { ...defaultParams, ...params };
    const { name, widthSegment, heightSegment, color, continentsScale, noiseScale, atmosphereParams } = sanitizedParams;

    // Create the material
    const material = new THREE.ShaderMaterial({
        vertexShader: standardVertexShader,
        fragmentShader: planetFragmentShader,
        uniforms:{
            uColor1: { value: new THREE.Color(color) },
            uNoiseScale: { value: noiseScale  },
            uContinentsScale: { value: continentsScale },
        }
    });

    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(radius, widthSegment, heightSegment),
        material
    );

    const guiParams = {
        scale:planet.scale.x
    }

    const guiPlanet = gui.addFolder(name || "Planet");
    guiPlanet.add(planet.position, 'x', -1000, 1000);
    guiPlanet.add(planet.position, 'y', -1000, 1000);
    
    const guiMaterial = guiPlanet.addFolder('Material');
    guiMaterial.add(material.uniforms.uNoiseScale, 'value', 0, 10).name('Noise Scale').onChange((value:number) => {
        material.uniforms.uNoiseScale.value = value;
    });
    guiMaterial.add(material.uniforms.uContinentsScale, 'value', 0, 10).name('Continents Scale').onChange((value:number) => {
        material.uniforms.uContinentsScale.value = value;
    });

    guiPlanet.add(guiParams, 'scale', 0.01, 10).onChange((value:number) => {
        planet.scale.set(value, value, value);
    })

    const atmosphere = createAtmosphere(radius + 10,guiPlanet, atmosphereParams);
    planet.add(atmosphere);

    const planetWithUpdate = addFunction(planet, 'update', (time:number) => {
        planet.rotation.y += 0.01;
        atmosphere.rotation.y -= 0.005;
        atmosphere.material.uniforms.uTime.value = time;
    });

    const planetWithDestroy = addFunction(planetWithUpdate, 'destroy', () => {
        guiPlanet.destroy();
        planet.geometry.dispose();
        planet.material.dispose();
    });

    return planetWithDestroy;
}
