vec3 hash(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));

    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(mix(dot(hash(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)), dot(hash(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x), mix(dot(hash(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)), dot(hash(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y), mix(mix(dot(hash(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)), dot(hash(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x), mix(dot(hash(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)), dot(hash(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

uniform float uNoiseScale;
uniform float uContinentsScale;
uniform float uSeed;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;
varying float vNoise;
varying vec3 vPolarCoord;

void main() {

    // // Convert uv to cartesian coordinates
    // float theta = vUv.y * 3.14159;
    // float phi = vUv.x * 3.14159 * 2.0;
    // vec3 unit = vec3(0.0, 0.0, 0.0);

    // unit.x = sin(phi) * sin(theta);
    // unit.y = cos(theta) * -1.0;
    // unit.z = cos(phi) * sin(theta);
    // unit = normalize(unit);
    
   float n = noise(vPolarCoord * uContinentsScale+uSeed);
   n += noise(vPolarCoord * 10.0) * 0.25 * uNoiseScale;
   n += noise(vPolarCoord * 20.0) * 0.125 * uNoiseScale;
   n += noise(vPolarCoord * 40.0) * 0.0625 * uNoiseScale;
   vec3 color = mix(uColor1,uColor2,smoothstep(-0.1, 0.0, n));
    // vec3 color = vec3(vNoise);
    gl_FragColor = vec4(color, 1.0);
}
