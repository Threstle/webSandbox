import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction } from '../utils/functionalUtils';
import { Destroyable } from '../types';

export interface Camera extends THREE.OrthographicCamera, Destroyable { 
  resize: (width:number,height:number) => void;
};

export function createCamera(
  width: number,
  height: number,
  near = 1,
  far = 1000,
  frustrumSize = 1,
  gui = container.resolve<GUI>("GUI")
): Camera {
  const camera = new THREE.OrthographicCamera(frustrumSize*width / - 2, frustrumSize*width / 2, frustrumSize*height / 2, frustrumSize*height / - 2, near, far);
  const guiCamera = gui.addFolder("Camera");
  guiCamera.add(camera.position, 'x', -1000, 1000);
  guiCamera.add(camera.position, 'y', -1000, 1000);

  const cameraWithResize = addFunction(camera, 'resize', (width:number,height:number) => {
    camera.left = -width/2;
    camera.right = width/2;
    camera.top = height/2;
    camera.bottom = -height/2;
    camera.updateProjectionMatrix();
  });

  const cameraWithDestroy = addFunction(cameraWithResize, 'destroy', () => {
    guiCamera.destroy();
   });

  return cameraWithDestroy;
}
