import * as THREE from 'three';
import { Texture } from "three/src/Three";

export function getTextureAverageHeight(texture: Texture) {
    const canvas = document.createElement("canvas");
    const { width, height } = texture.image;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(texture.image, 0, 0);
    const data = ctx.getImageData(0, 0, width, height);

    let totalHeight = 0;

    for (let i = 0; i < data.data.length; i += 4) {
        totalHeight += data.data[i];
    }

    return totalHeight / (data.data.length / 4);

}

export async function getVerticesFromSVG(svg: string, precision: number = 100) {

    function toVertex(pathSVG: any, n: number) {
        let pathLength = pathSVG.getTotalLength();
        let vtx = [];
        var i = 0;
        while (i < pathLength) {

            let { x, y } = pathSVG.getPointAtLength(i);

            // x *= 0.2;
            // y *= 0.2;

            vtx.push(new THREE.Vector2(x, y));

            i += n;
        }
        return vtx;
    }

    var loadSvg = function (url: string) {
        return fetch(url)
            .then(function (response) { return response.text(); })
            .then(function (raw) { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
    }

    const loadedSvg = await loadSvg(svg);

    const path: SVGPathElement = loadedSvg.getElementsByTagName('path')[0] as SVGPathElement;

    return toVertex(path, precision);


}