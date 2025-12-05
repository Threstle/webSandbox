import { Rocket } from "../entities/rocket";
import { AsciiFilter } from "../effects/asciiFilter";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";

export interface InputManagerParams {
  rocket: Rocket;
}

export function setupInputHandlers(params: InputManagerParams): () => void {
  const { rocket } = params;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyQ') {
      rocket.isThrusterTopLeftOn = true;
    }
    if (e.code === 'KeyS') {
      rocket.isThrusterBottomLeftOn = true;
    }
    if (e.code === 'KeyP') {
      rocket.isThrusterTopRightOn = true;
    }
    if (e.code === 'KeyL') {
      rocket.isThrusterBottomRightOn = true;
    }
    if (e.code === 'Space') {
      rocket.isAccelerating = true;
    }
    if (e.code === 'Backspace') {
      rocket.isBreaking = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyQ') {
      rocket.isThrusterTopLeftOn = false;
    }
    if (e.code === 'KeyS') {
      rocket.isThrusterBottomLeftOn = false;
    }
    if (e.code === 'KeyP') {
      rocket.isThrusterTopRightOn = false;
    }
    if (e.code === 'KeyL') {
      rocket.isThrusterBottomRightOn = false;
    }
    if (e.code === 'Space') {
      rocket.isAccelerating = false;
    }
    if (e.code === 'Backspace') {
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
