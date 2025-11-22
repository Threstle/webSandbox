import { Rocket } from "../entities/rocket";
import { AsciiFilter } from "../effects/asciiFilter";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";

export interface InputManagerParams {
  rocket: Rocket;
}

export function setupInputHandlers(params: InputManagerParams): () => void {
  const { rocket } = params;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'ArrowUp') {
      rocket.isAccelerating = true;
      rocket.isBreaking = false;
    }
    if (e.code === 'ArrowLeft') {
      rocket.isRotatingLeft = true;
      rocket.isBreaking = false;
    }
    if (e.code === 'ArrowRight') {
      rocket.isRotatingRight = true;
      rocket.isBreaking = false;
    }
    if (e.code === 'ArrowDown') {
      rocket.isBreaking = true;
      rocket.isAccelerating = false;
      rocket.isRotatingLeft = false;
      rocket.isRotatingRight = false;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowUp') {
      rocket.isAccelerating = false;
    }
    if (e.code === 'ArrowLeft') {
      rocket.isRotatingLeft = false;
    }
    if (e.code === 'ArrowRight') {
      rocket.isRotatingRight = false;
    }
    if (e.code === 'ArrowDown') {
      rocket.isBreaking = false;
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };
}
