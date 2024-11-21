import "reflect-metadata";
import { container } from "tsyringe";
import GUI from 'lil-gui';
import { TextureLoader } from "three";

// re-export the container, so people must import this file
// and not accidentally get `container' directly from tsyringe
export { container };

export { GUI };
container.register<GUI>("GUI", {
  useValue:  new GUI(),
});

container.register<TextureLoader>("TextureLoader", {
  useValue:  new TextureLoader(),
});