import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable } from '../types';

import reliefMapVertexShader from '../shaders/reliefMap/reliefMap.vs';
import reliefMapFragmentShader from '../shaders/reliefMap/reliefMap.fs';

export interface ReliefMap extends THREE.Mesh, Destroyable, Updatable { };


export interface ReliefMapParams {
}

const defaultParams: ReliefMapParams = {
}

export async function createReliefMap(
    heightMap:THREE.Texture,
    params?: ReliefMapParams,
    gui = container.resolve<GUI>("GUI"),
): Promise<ReliefMap> {

    const sanitizedParams = { ...defaultParams, ...params };
    let {} = sanitizedParams;

    const material = new THREE.ShaderMaterial({
        vertexShader: reliefMapVertexShader,
        fragmentShader: reliefMapFragmentShader,
        uniforms:{
            renderTarget: { value: heightMap },
            uPos: { value:new THREE.Vector2(0.5,0.5) },
            uRadius : { value: 0.1 },
            uHeightAmp : {value:200}
        }
        
    });
    const reliefMap = new THREE.Mesh(
        new THREE.PlaneGeometry(700, 700,100,100),
        material
    );

    const reliefMapWithDestroy = addFunction(reliefMap, 'destroy', () => {
        reliefMap.geometry.dispose();
        reliefMap.material.dispose();
    });

    const reliefMapWithUpdate = addFunction(reliefMapWithDestroy, 'update', (time: number, normalizedPosition: THREE.Vector2,radius:number,rotation:number) => {

        if(normalizedPosition){
            material.uniforms.uPos.value = normalizedPosition;
        }
        if(radius){
            material.uniforms.uRadius.value = radius;
        }

        reliefMap.rotation.z = rotation;
    });


    const guiReliefMap = gui.addFolder('Relief Map');

    guiReliefMap.add(material.uniforms.uHeightAmp, 'value', 0, 600).name('Height Amp').onChange((value: number) => {
        material.uniforms.uHeightAmp.value = value
    });



        return reliefMapWithUpdate;
    }
