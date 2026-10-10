export const faceWarpShader = {
  vertexShader: `
    varying vec2 vUv;
    uniform vec2 uAnchor;
    uniform float uWarpStrength;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float dist = distance(uv, uAnchor);
      if (dist < 0.25) {
        pos.xy += normalize(uv - uAnchor) * (0.25 - dist) * uWarpStrength;
      }
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `
};