import * as THREE from 'three';
import { container, GUI } from './autoinject';
import { addFunction } from './functionalUtils';

export interface Camera extends THREE.OrthographicCamera {
  destroy: () => void;
};

export function createCamera(
  width: number,
  height: number,
  near = 1,
  far = 1000,
):Camera {
  const camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, near, far);
  const guiCamera = container.resolve<GUI>("GUI").addFolder("Camera");
  guiCamera.add(camera.position, 'x', -1000, 1000);
  guiCamera.add(camera.position, 'y', -1000, 1000);

  const cameraWithDestroy = addFunction(camera, 'destroy', () => {});

  return cameraWithDestroy;
}
