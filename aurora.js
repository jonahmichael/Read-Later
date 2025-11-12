// Aurora Background Effect using OGL
// Adapted for vanilla JS from React component

const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  vec3 color0 = uColorStops[0];
  vec3 color1 = uColorStops[1];
  vec3 color2 = uColorStops[2];
  
  vec3 rampColor;
  if (uv.x < 0.5) {
    rampColor = mix(color0, color1, uv.x * 2.0);
  } else {
    rampColor = mix(color1, color2, (uv.x - 0.5) * 2.0);
  }
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 1, b: 1 };
}

function initAurora() {
    const canvas = document.getElementById('aurora-canvas');
    if (!canvas) return;

    // Color palette from the project
    const colorStops = ['#004e98', '#3a6ea5', '#ff6700']; // Polynesian Blue -> Bice Blue -> Pumpkin
    const amplitude = 1.2;
    const blend = 0.6;

    const { Renderer, Program, Mesh, Geometry } = OGL;

    const renderer = new Renderer({
        canvas: canvas,
        alpha: true,
        premultipliedAlpha: true,
        antialias: true
    });
    
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let program;

    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        if (program) {
            program.uniforms.uResolution.value = [width, height];
        }
    }
    
    window.addEventListener('resize', resize);

    // Create fullscreen triangle geometry
    const geometry = new Geometry(gl, {
        position: {
            size: 2,
            data: new Float32Array([
                -1, -1,
                3, -1,
                -1, 3
            ])
        }
    });

    const colorStopsArray = colorStops.map(hex => {
        const c = hexToRgb(hex);
        return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
            uTime: { value: 0 },
            uAmplitude: { value: amplitude },
            uColorStops: { value: colorStopsArray.flat() },
            uResolution: { value: [window.innerWidth, window.innerHeight] },
            uBlend: { value: blend }
        },
        transparent: true
    });

    const mesh = new Mesh(gl, { geometry, program });

    let time = 0;
    function update(t) {
        requestAnimationFrame(update);
        time = t * 0.0001;
        program.uniforms.uTime.value = time;
        renderer.render({ scene: mesh });
    }
    
    requestAnimationFrame(update);
    resize();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAurora);
} else {
    initAurora();
}
