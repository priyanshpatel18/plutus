import Script from 'next/script';

export default function BackgroundFog() {
  return (
    <div>
      <div
        id="vanta-background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: -1,
        }}
      ></div>

      <Script
        src="https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          VANTA.FOG({
            el: "#vanta-background",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            baseColor: "#080808",
            highlightColor: "#181818",
            midtoneColor: "#282828",
            lowlightColor: "#383838",
          });
        }}
      />
    </div>
  )
}
