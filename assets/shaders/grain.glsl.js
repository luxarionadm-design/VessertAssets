export const grainShader = {
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;
    float rand(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      float noise = (rand(vUv * uTime) - 0.5) * 0.08;
      gl_FragColor = vec4(col.rgb + noise, col.a);
    }
  `
};