import { useEffect, useState } from "react";

import idleLeft from "../assets/sprites/nebula/nebula_idle_left.png";
import blinkLeft from "../assets/sprites/nebula/nebula_blink_left.png";
import walkLeft1 from "../assets/sprites/nebula/nebula_walk_left_1.png";
import walkLeft2 from "../assets/sprites/nebula/nebula_walk_left_2.png";
import tailFlick1 from "../assets/sprites/nebula/nebula_tail_flick_1.png";
import tailFlick2 from "../assets/sprites/nebula/nebula_tail_flick_2.png";

const idleFrames = [idleLeft];
const blinkFrames = [blinkLeft];
const walkFrames = [walkLeft1, walkLeft2];
const tailFlickFrames = [tailFlick1, tailFlick2];

export default function NebulaSprite({
  blinkOn,
  behavior = "idle",
  x = 0,
  walkDirection = 1,
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  const activeFrames =
    blinkOn && behavior === "idle"
      ? blinkFrames
      : behavior === "walk"
      ? walkFrames
      : behavior === "tailFlick"
      ? tailFlickFrames
      : idleFrames;

  useEffect(() => {
    if (blinkOn) return;
    if (behavior !== "walk" && behavior !== "tailFlick") return;

    const frames = behavior === "walk" ? walkFrames : tailFlickFrames;
    const speed = behavior === "walk" ? 260 : 180;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, speed);

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
        transform: `translateX(${x}px) translateY(40px) scaleX(${walkDirection === 1 ? -1 : 1})`,
      }}
    />
  );
}