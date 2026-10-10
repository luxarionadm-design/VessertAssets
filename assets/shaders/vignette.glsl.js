export const vignetteShader = {
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uRadius;
    uniform float uDarkness;
    varying vec2 vUv;
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      vec2 center = vec2(0.5);
      float dist = distance(vUv, center);
      float vig = smoothstep(uRadius, uRadius - 0.45, dist);
      col.rgb = mix(col.rgb * (1.0 - uDarkness), col.rgb, vig);
      gl_FragColor = col;
    }
  `
};