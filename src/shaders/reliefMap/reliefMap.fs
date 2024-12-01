
uniform float uNoiseAmp;
uniform float uNoiseFreq;
uniform float uStep;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec2 vUv;
varying float vElevation;

void main() {

    // float colorMod = noise(vec3(vUv.x, vUv.y,12.0)*uNoiseFreq)*uNoiseAmp;
    // // float steppedColorMod = floor(colorMod*uStep)/uStep;
    // vec3 color = mix(uColor1, uColor2, colorMod);
    // // vec3 steppedColor = floor(color*100.0)/100.0;

    // // vec3 color = vec3(vNoise);
    gl_FragColor = vec4(vec3(0.0,vElevation,0.0), 1.0);
}
