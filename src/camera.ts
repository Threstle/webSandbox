import * as THREE from 'three';
import { container, GUI } from './autoinject';
import { addFunction } from './functionalUtils';
import { Destroyable } from './types';

export interface Camera extends THREE.OrthographicCamera, Destroyable { };

export function createCamera(
  width: number,
  height: number,
  near = 1,
  far = 1000,
  gui = container.resolve<GUI>("GUI")
): Camera {
  const camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, near, far);
  const guiCamera = gui.addFolder("Camera");
  guiCamera.add(camera.position, 'x', -1000, 1000);
  guiCamera.add(camera.position, 'y', -1000, 1000);

  const cameraWithDestroy = addFunction(camera, 'destroy', () => {
    guiCamera.destroy();
   });

  return cameraWithDestroy;
}
