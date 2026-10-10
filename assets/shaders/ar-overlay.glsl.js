export const arOverlayShader = {
  fragmentShader: `
    uniform sampler2D tCamera;
    uniform sampler2D tMesh;
    varying vec2 vUv;
    void main() {
      vec4 cam = texture2D(tCamera, vUv);
      vec4 mesh = texture2D(tMesh, vUv);
      gl_FragColor = mix(cam, mesh, mesh.a * 0.9);
    }
  `
};