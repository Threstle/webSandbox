import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Updatable } from './../types';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { getTextureAverageHeight } from '../utils/imageUtils';

import vertexShader from '../shaders/standard/standard.vs';
import fragmentShader from '../shaders/postprocessing/ascii.fs'
import { ASCII } from '../conf';

export interface AsciiFilter extends ShaderPass, Updatable { };


export interface AsciiFilterParams {
    ratio?: number;
    enabled?: boolean;
}

const defaultParams: AsciiFilterParams = {
    ratio: 1,
    enabled: true,
}

export async function createAsciiFilter(
    asciiTexture: string,
    params?: AsciiFilterParams,
    gui = container.resolve<GUI>("GUI"),
    textureLoader = container.resolve<THREE.TextureLoader>("TextureLoader"),
): Promise<AsciiFilter> {


    const sanitizedParams = { ...defaultParams, ...params };
    let {
        ratio,
    } = sanitizedParams;

    const {resolution,enabled} = ASCII;


    const loadedTexture = await textureLoader.loadAsync(asciiTexture);

    const heightRatio = 127.5/getTextureAverageHeight(loadedTexture);


    const asciiFilter = new ShaderPass({
        vertexShader,
        fragmentShader,
        uniforms: {
            'tDiffuse': { value: null },
            'uScreenRatio': { value: ratio },
            'uOpacity': { value: 1 },
            'uRes': { value: resolution },
            'uAsciiTexture': { value: loadedTexture },
            'uRadius': { value: 0.3 },
            'uHeightRatio': { value: heightRatio },
        },
    });

    asciiFilter.enabled = enabled;


    const asciiShaderGui = gui.addFolder('AsciiShader');
    asciiShaderGui.add(asciiFilter.uniforms.uRes, 'value', 20, 300).name('Resolution').onChange((value: number) => {
        asciiFilter.material.uniforms.uRes.value = value;
    });
    
    asciiShaderGui.add(asciiFilter, 'enabled').name('Enabled').onChange((value: boolean) => {
        asciiFilter.enabled = value;
    });

    const asciiWithUpdate = addFunction(asciiFilter, 'update', (time: number,radius:number,res:number) => {       
        console.log(res)
        asciiFilter.material.uniforms.uRes.value = res;

        if(radius){
            asciiFilter.material.uniforms.uRadius.value = radius;
        }
    });

    return asciiWithUpdate;
}
