import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable, Updatable } from './../types';

import floorVertexShader from '../shaders/floor/floor.vs';
import floorFragmentShader from '../shaders/floor/floor.fs';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { AsciiShader } from '../shaders/postprocessing/Ascii';

export interface AsciiFilter extends ShaderPass, Updatable { };


export interface AsciiFilterParams {
    ratio?: number;
    resolution?: number;
    limit?: number;
    ondulation?: number;
    step?:number;
}

const defaultParams: AsciiFilterParams = {
    ratio: 1,
    resolution: 120,
    limit: 0.3,
    ondulation: 0.1,
    step:10
}

export async function createAsciiFilter(
    asciiTexture: string,
    params?: AsciiFilterParams,
    gui = container.resolve<GUI>("GUI"),
    textureLoader = container.resolve<THREE.TextureLoader>("TextureLoader"),
): Promise<AsciiFilter> {


    const sanitizedParams = { ...defaultParams, ...params };
    let {
        ratio, resolution, limit, ondulation, step
    } = sanitizedParams;


    const loadedTexture = await textureLoader.loadAsync(asciiTexture);

    const asciiFilter = new ShaderPass({
        ...AsciiShader,
        uniforms: {
            'tDiffuse': { value: null },
            'uScreenRatio': { value: ratio },
            'uOpacity': { value: 1 },
            'uRes': { value: resolution },
            'uOndulation': { value: 0 },
            'uLimit': { value: limit },
            'uStep': { value: step },
            'uAsciiTexture': { value: loadedTexture }
        },
    });

    const asciiShaderGui = gui.addFolder('AsciiShader');
    asciiShaderGui.add(asciiFilter.uniforms.uRes, 'value', 20, 300).name('Resolution').onChange((value: number) => {
        asciiFilter.material.uniforms.uRes.value = value;
    });
    asciiShaderGui.add(asciiFilter.uniforms.uStep, 'value', 0.1, 20).name('Step').onChange((value: number) => {
        asciiFilter.material.uniforms.uStep.value = value;
    });
    asciiShaderGui.add(asciiFilter.uniforms.uLimit, 'value', 0, 1).name('Limit').onChange((value: number) => {
        asciiFilter.material.uniforms.uLimit.value = value;
    });
    asciiShaderGui.add(asciiFilter.uniforms.uOndulation, 'value', -1, 1).name('Ondulation').onChange((value: number) => {
        ondulation = value;
    });
    
    asciiShaderGui.add(asciiFilter, 'enabled').name('Enabled').onChange((value: boolean) => {
        asciiFilter.enabled = value;
    });

    const asciiWithUpdate = addFunction(asciiFilter, 'update', (time: number) => {
        const ondulationPulse = Math.sin(time / 1000) * ondulation * 0.1;
        const stepPulse = Math.sin(time / 1000) + step;
        const resolutionPulse = Math.sin(time / 1000) + resolution;
        asciiFilter.material.uniforms.uOndulation.value = ondulationPulse;
        asciiFilter.material.uniforms.uStep.value = stepPulse;
        asciiFilter.material.uniforms.uRes.value = resolutionPulse;
    });

    return asciiWithUpdate;
}
