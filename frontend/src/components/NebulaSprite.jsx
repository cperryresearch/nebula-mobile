import { useEffect, useState } from "react";

import idle1 from "../assets/sprites/nebula_idle_1.png";
import idle2 from "../assets/sprites/nebula_idle_2.png";
import idle3 from "../assets/sprites/nebula_idle_3.png";

const frames = [idle1, idle2, idle3];

export default function NebulaSprite() {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
  <img
    src={frames[frameIndex]}
    alt="Nebula"
    style={{
      width: "160px",
      imageRendering: "pixelated",
      transform: "translateY(40px)"
    }}
  />
);
}