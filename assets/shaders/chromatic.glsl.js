export const chromaticShader = {
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uOffset;
    varying vec2 vUv;
    void main() {
      float r = texture2D(tDiffuse, vUv + uOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - uOffset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};