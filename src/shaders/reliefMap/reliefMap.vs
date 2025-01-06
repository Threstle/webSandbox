uniform sampler2D renderTarget;
uniform vec2 uPos;
uniform float uRadius;
uniform float uHeightAmp;

varying vec2 vUv;
varying float vElevation;


void main() {



    float res = 0.5 / uRadius;

    vec2 offsetUVs = vec2(
      uv.x+uPos.x*res-0.5,
      uv.y+uPos.y*res-0.5  
    );

    float elevation = 1.0-texture2D(renderTarget, offsetUVs/res).r;

    if(uv.x < 0.01 || uv.x > 0.99 || uv.y < 0.01 || uv.y > 0.99){
        elevation = 0.0;
    }

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += elevation*uHeightAmp;
  

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    vUv = uv;
    vElevation = elevation;
}
