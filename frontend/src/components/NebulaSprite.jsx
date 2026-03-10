import { useEffect, useState } from "react";

import idleLeft from "../assets/sprites/nebula/nebula_idle_left.png";
import blinkLeft from "../assets/sprites/nebula/nebula_blink_left.png";
import walkLeft1 from "../assets/sprites/nebula/nebula_walk_left_1.png";
import walkLeft2 from "../assets/sprites/nebula/nebula_walk_left_2.png";

const idleFrames = [idleLeft];
const blinkFrames = [blinkLeft];
const walkFrames = [walkLeft1, walkLeft2];

export default function NebulaSprite({ blinkOn, behavior = "idle", x = 0 }) {
  const [frameIndex, setFrameIndex] = useState(0);

  const activeFrames = blinkOn
    ? blinkFrames
    : behavior === "walk"
    ? walkFrames
    : idleFrames;

  useEffect(() => {
    setFrameIndex(0);
  }, [blinkOn, behavior]);

  useEffect(() => {
    if (blinkOn || behavior !== "walk") return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % walkFrames.length);
    }, 260);

    return () => {
      clearInterval(interval);
    };
  }, [blinkOn, behavior]);

  return (
    <img
      src={activeFrames[frameIndex] || idleLeft}
      alt="Nebula"
      style={{
        width: "144px",
        imageRendering: "pixelated",
        transform: `translateX(${x}px) translateY(40px) scaleX(${x < 0 ? -1 : 1})`,
      }}
    />
  );
}