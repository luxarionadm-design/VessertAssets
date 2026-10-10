export const stickerTrackShader = {
  fragmentShader: `
    uniform sampler2D tSticker;
    uniform sampler2D tBackground;
    varying vec2 vUv;
    void main() {
      vec4 bg = texture2D(tBackground, vUv);
      vec4 sticker = texture2D(tSticker, vUv);
      gl_FragColor = mix(bg, sticker, sticker.a);
    }
  `
};