vec2 getCell(vec2 uv, float res) {

    return vec2(floor(uv.x * res) / res, floor(uv.y * res) / res);
}

vec2 getPosInCell(vec2 uv, float res) {

    return vec2(fract(uv.x * res), fract(uv.y * res));
}

uniform float uRes;
uniform float uScreenRatio;
uniform float uRadius;
uniform float uHeightRatio;
uniform sampler2D uAsciiTexture;
uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {

    float res = uRes;
    float cellSize = 0.0625;

    vec2 ratioUv = vec2(vUv.x, vUv.y);

    vec2 gridPos = getCell(ratioUv, res);
    vec2 posInCell = getPosInCell(ratioUv, res);

    vec4 texel = texture2D(tDiffuse, gridPos);

    float texelAvg = (texel.r + texel.g + texel.b) / 3.0;

    float asciiHeight = round(texelAvg * 100.0) / 100.0;

    vec2 asciiCharPos = vec2(cellSize * 0.0, 1.0 - cellSize * 4.0);

    asciiCharPos.x = cellSize * round(asciiHeight * 10.0);

    float distFromCenter = distance(vec2(gridPos.x * uScreenRatio, gridPos.y), vec2(0.5 * uScreenRatio, 0.5));
    if(distFromCenter > uRadius)
        asciiCharPos.x = cellSize * 0.0;

    vec4 asciiTexel = 1.0 - texture2D(uAsciiTexture, vec2(asciiCharPos.x + posInCell.x * cellSize, asciiCharPos.y + posInCell.y * cellSize));

    if(distFromCenter > uRadius) {
        gl_FragColor = vec4(asciiTexel.r, asciiTexel.g, asciiTexel.b, 1.0 - distFromCenter * 2.0);
    } else {
        gl_FragColor = vec4(asciiTexel.r * texel.r, asciiTexel.g * texel.g, asciiTexel.b * texel.b, 1.0 - asciiHeight);
    }
}