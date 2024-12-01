import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable } from './../types';

import floorVertexShader from '../shaders/floor/floor.vs';
import floorFragmentShader from '../shaders/floor/floor.fs';
// import { getTextureHeightRange } from '../utils/imageUtils';

export interface Floor extends THREE.Mesh, Destroyable, Updatable { };


export interface FloorParams {
    size: number;
}

const defaultParams: Partial<FloorParams> = {
}

export function createFloor(
    heightMap: THREE.Texture,
    params?: FloorParams,
    gui = container.resolve<GUI>("GUI")
): Floor {

    const sanitizedParams = { ...defaultParams, ...params };
    let {
        size
    } = sanitizedParams;

    // const heightRange = getTextureHeightRange(heightMap);

    const material = new THREE.ShaderMaterial({
        vertexShader: floorVertexShader,
        fragmentShader: floorFragmentShader,
        uniforms: {
            uNoiseFreq: { value: 10 },
            uNoiseAmp: { value: 10 },
            uStep: { value: 1.7 },
            uColor1: { value: new THREE.Color(0x6737ae) },
            uColor2: { value: new THREE.Color(0x00e096) },
            uHeightmap: { value: heightMap },
            uHeightRange: { value:new THREE.Vector2(0,1) }
        }
    });
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size, 1),
        material
    );

    const floorWithDestroy = addFunction(floor, 'destroy', () => {
        // guiPlanet.destroy();
        floor.geometry.dispose();
        floor.material.dispose();
    });

    const floorWithUpdate = addFunction(floorWithDestroy, 'update', (time: number) => {
        // floor.rotation.y += 0.005;
        // floor.rotation.x += 0.005;
    });


    // const guiFloor = gui.addFolder('Floor');

    // guiFloor.add(material.uniforms.uNoiseAmp, 'value', 0, 100).name('Noise Amp').onChange((value: number) => {
    //     material.uniforms.uNoiseAmp.value = value;
    // });
    // guiFloor.add(material.uniforms.uNoiseFreq, 'value', 0, 100).name('Noise Freq').onChange((value: number) => {
    //     material.uniforms.uNoiseFreq.value = value;
    // });
    // guiFloor.add(material.uniforms.uStep, 'value', 0, 10).name('Step').onChange((value: number) => {
    //     material.uniforms.uStep.value = value;
    // });
    // guiFloor.addColor(material.uniforms.uColor1, 'value').name('Color').onChange((value: number) => {
    //     material.uniforms.uColor1.value = value;
    // })
    // guiFloor.addColor(material.uniforms.uColor2, 'value').name('Color').onChange((value: number) => {
    //     material.uniforms.uColor2.value = value;
    // })

        return floorWithUpdate;
    }
