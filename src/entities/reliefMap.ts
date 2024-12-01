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

    const pos = new THREE.Vector2(0.5,0.5);

    const material = new THREE.ShaderMaterial({
        vertexShader: reliefMapVertexShader,
        fragmentShader: reliefMapFragmentShader,
        uniforms:{
            renderTarget: { value: heightMap },
            uPos: { value:pos },
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

    const reliefMapWithUpdate = addFunction(reliefMapWithDestroy, 'update', (time: number, normalizedPosition: THREE.Vector2,radius:number) => {

        // reliefMap.rotation.z = Math.sin(time/1000);
        if(normalizedPosition){
            material.uniforms.uPos.value = normalizedPosition;
        }
        if(radius){
            material.uniforms.uRadius.value = radius;
        }
    });


    const guiReliefMap = gui.addFolder('Relief Map');

    // guiReliefMap.add(material.uniforms.uRadius, 'value', 0, 1).name('Radius').onChange((value: number) => {
    //     material.uniforms.uRadius.value = value;
    // });
    
    // guiReliefMap.add(pos, 'x', -1, 2).name('x').onChange((value: number) => {
    //     material.uniforms.uPos.value = pos
    // });

    // guiReliefMap.add(pos, 'y', -1, 2).name('y').onChange((value: number) => {
    //     material.uniforms.uPos.value = pos
    // });

    guiReliefMap.add(material.uniforms.uHeightAmp, 'value', 0, 600).name('Height Amp').onChange((value: number) => {
        material.uniforms.uHeightAmp.value = value
    });



        return reliefMapWithUpdate;
    }
