import { Texture } from "three/src/Three";

export function getTextureAverageHeight(texture: Texture) {
    const canvas = document.createElement("canvas");
    const {width, height} = texture.image;
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