

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uHeightmap;
uniform vec2 uHeightRange;

varying vec2 vUv;

void main() {
    float height = texture2D(uHeightmap, vUv).r;
    vec3 color = mix(uColor1, uColor2, height);
    gl_FragColor = vec4(color, 1.0);
}
