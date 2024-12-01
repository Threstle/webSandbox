uniform sampler2D renderTarget;
uniform vec2 uPos;
uniform float uRadius;
uniform float uHeightAmp;

varying vec2 vUv;
varying float vElevation;




void main() {

    float res = 1.0 / uRadius;

    vec2 offsetUVs = vec2(
      uv.x+uPos.x*res,
      uv.y+uPos.y*res  
    );

    float elevation = 1.0-texture2D(renderTarget, offsetUVs/res).r;

    if(uv.x < 0.01 || uv.x > 0.99 || uv.y < 0.01 || uv.y > 0.99){
        elevation = 0.0;
    }

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += elevation*uHeightAmp;
    // Elevation
    // float elevation = sin(modelPosition.x * 10.0 * 1.0) *
    //                   sin(modelPosition.z * 10.0 * 1.0) *
    //                   1.0;

    // // for(float i = 1.0; i <= uSmallIterations; i++)
    // // {
    // //     elevation -= abs(cnoise(vec3(modelPosition.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
    // // }
    
    // modelPosition.y += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    vUv = uv;
    vElevation = elevation;
}
