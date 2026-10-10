export const blurShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    varying vec2 vUv;
    void main() {
      vec4 color = vec4(0.0);
      vec2 off = 1.0 / uResolution;
      color += texture2D(tDiffuse, vUv + vec2(-off.x, -off.y)) * 0.0625;
      color += texture2D(tDiffuse, vUv + vec2(0.0, -off.y)) * 0.125;
      color += texture2D(tDiffuse, vUv + vec2(off.x, -off.y)) * 0.0625;
      color += texture2D(tDiffuse, vUv + vec2(-off.x, 0.0)) * 0.125;
      color += texture2D(tDiffuse, vUv) * 0.25;
      color += texture2D(tDiffuse, vUv + vec2(off.x, 0.0)) * 0.125;
      color += texture2D(tDiffuse, vUv + vec2(-off.x, off.y)) * 0.0625;
      color += texture2D(tDiffuse, vUv + vec2(0.0, off.y)) * 0.125;
      color += texture2D(tDiffuse, vUv + vec2(off.x, off.y)) * 0.0625;
      gl_FragColor = color;
    }
  `
};