/**
 * Full-screen textured quad shader
 */

const AsciiShader = {
  name: "AsciiShader",
  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		vec2 getCell( vec2 uv, float res )
		{

			return vec2(
				floor(uv.x*res)/res,
				floor(uv.y*res)/res
			);
		}

		vec2 getPosInCell( vec2 uv, float res )
		{

			return vec2(
				fract(uv.x*res),
				fract(uv.y*res)
			);
		}


		uniform float uRes;
		uniform float uScreenRatio;
		uniform float uLimit;
		uniform float uStep;
		uniform float uOndulation;
        uniform sampler2D uAsciiTexture;
		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {


            float res = uRes + uOndulation*100.0;
			float cellSize = 0.0625;

			// vec2 ratioUv = vec2(uScreenRatio*vUv.x, vUv.y);
			vec2 ratioUv = vec2(vUv.x, vUv.y);

			vec2 gridPos = getCell(ratioUv, res);
			vec2 posInCell = getPosInCell(ratioUv, res);

			vec4 texel = texture2D( tDiffuse, gridPos );


			float texelAvg = (texel.r + texel.g + texel.b) / 3.0;
			
			float asciiHeight = round(texelAvg*100.0)/100.0;

			float steppedAsciiHeight = floor(asciiHeight*uStep)/uStep;

			vec2 asciiCharPos = vec2(cellSize*0.0,1.0 - cellSize*4.0);
			
			asciiCharPos.x = cellSize*round(steppedAsciiHeight*10.0);

			float limitWithOndulation = uLimit + uOndulation;

			float distFromCenter = distance(vec2(gridPos.x*uScreenRatio,gridPos.y), vec2(0.5*uScreenRatio,0.5));
			if(distFromCenter>limitWithOndulation)asciiCharPos.x = cellSize*0.0;


			vec4 asciiTexel = 1.0 - texture2D(uAsciiTexture, vec2(asciiCharPos.x+posInCell.x*cellSize, asciiCharPos.y+posInCell.y*cellSize));

			if(distFromCenter>limitWithOndulation){
				gl_FragColor = vec4(asciiTexel.r,asciiTexel.g,asciiTexel.b,1.0 - distFromCenter*2.0);
			}
			else{
				gl_FragColor = vec4(
				asciiTexel.r*texel.r,
				asciiTexel.g*texel.g,
				asciiTexel.b*texel.b,
				1.0-steppedAsciiHeight
			);
			}

			
			// gl_FragColor = texture2D( tDiffuse, gridPos );
			// gl_FragColor = uOpacity * texel;


		}`,
};

export { AsciiShader };
