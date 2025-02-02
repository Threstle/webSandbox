import "pathseg";
import "poly-decomp";
import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
const shapes = [
    require('../assets/ast1.svg'),
    require('../assets/ast2.svg'),
    require('../assets/ast3.svg'),
    require('../assets/ast4.svg'),
    require('../assets/ast5.svg'),
    require('../assets/ast6.svg'),
    // require('../assets/ast7.svg'),
];


export interface Asteroid extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    setPosition(x: number, y: number): void;
    body: MATTER.Body;
};




export async function createAsteroid(
    scale: number,
): Promise<Asteroid> {

    MATTER.Common.setDecomp(require('poly-decomp'));

    var loadSvg = function (url: string) {
        return fetch(url)
            .then(function (response) { return response.text(); })
            .then(function (raw) { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
    }

    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

    const loadedSvg = await loadSvg(randomShape);
    //@ts-ignore
    const path: SVGPathElement = loadedSvg.getElementsByTagName('path')[0] as SVGPathElement;

    function getBoundsFromVertices(vertices: THREE.Vector2[]) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
    
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            if (vertex.x < minX) minX = vertex.x;
            if (vertex.x > maxX) maxX = vertex.x;
            if (vertex.y < minY) minY = vertex.y;
            if (vertex.y > maxY) maxY = vertex.y;
        }
    
        return {
            minX,
            minY,
            maxX,
            maxY,
            // Optional additional properties
            width: maxX - minX,
            height: maxY - minY,
        };
    }

    function getCentroid(vertices: THREE.Vector2[]) {
        let sumX = 0;
        let sumY = 0;
        const numVertices = vertices.length;
        for (let i = 0; i < numVertices; i++) {
            sumX += vertices[i].x;
            sumY += vertices[i].y;
        }
        return new THREE.Vector2(sumX / numVertices, sumY / numVertices);
    }

    function toVertex(pathSVG: any, n: number) {
        let pathLength = pathSVG.getTotalLength();
        let vtx = [];
        var i = 0;
        while (i < pathLength) {

            let { x, y } = pathSVG.getPointAtLength(i);

            x *= scale;
            y *= scale;


            vtx.push(new THREE.Vector2(x, y));

            i += n;
        }
        return vtx;
    }

    function repositionVertices(vertices: THREE.Vector2[]) {
        const centroid = getCentroid(vertices);
        // Reposition vertices
        const repositionedVertices = vertices.map((vertex) => new THREE.Vector2(vertex.x - centroid.x, vertex.y - centroid.y));

        return repositionedVertices;
    }
    

    const vertices = toVertex(path, 100);
    let repositionedVertices = repositionVertices(vertices);

    const body = MATTER.Bodies.fromVertices(0, 0, [vertices], {
        friction: 1,
        mass: 10,
    });
    
    const ogBounds = getBoundsFromVertices(vertices);
    const bodyBounds = body.bounds;
    

    const offset = [
        ogBounds.minX - bodyBounds.min.x,
        ogBounds.minY - bodyBounds.min.y,
       ogBounds.maxX - bodyBounds.max.x,
       ogBounds.maxY - bodyBounds.max.y,
    ];
    console.log(offset,ogBounds,bodyBounds);

    const offsetVertices = vertices.map((vertex) => new THREE.Vector2(vertex.x - offset[0], vertex.y - offset[1]));

    const shape = new THREE.Shape();
    shape.setFromPoints(offsetVertices);
    const geometry = new THREE.ShapeGeometry(shape);
    // const geometry = new THREE.BoxGeometry(100, 100, 1);

    const material = new THREE.MeshBasicMaterial({ color: 0x00FF00, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    // const body = MATTER.Bodies.rectangle(0, 0, 100, 100, {
    //     friction: 1,
    //     mass: 10,
    // });

    
  
    // console.log(body.bounds.min.x - bounds[0])

    // Matter.Body.setCentre(body,new THREE.Vector2(0,0) );
    // MATTER.Body.setCentre(body,getCentroid(repositionedVertices));

    const meshDebug = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 1),
        new THREE.MeshBasicMaterial({ color: 0xFF0000, side: THREE.DoubleSide })
    );

    mesh.add(meshDebug);

    // const body = MATTER.Bodies.rectangle(0, 0, 100, 100)



    MATTER.Body.setAngularVelocity(body, Math.random() * 1);
    MATTER.Body.setVelocity(body, new THREE.Vector2(Math.random() * 1, Math.random() * 1));

    const base = {
        mesh,
        body,
    }

    const updatePositionFromBody = () => {
        mesh.position.set(body.position.x, body.position.y, mesh.position.z);
        mesh.rotation.z = body.angle;
    }

    let lastTimestamp = 0;
    const update = (time: number) => {
        updatePositionFromBody();
    }


    const setPosition = (x: number, y: number) => {
        Matter.Body.setPosition(body, MATTER.Vector.create(x, y));
        updatePositionFromBody();
    }

    const destroy = () => {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }

    return completeAssign(base, {
        update,
        destroy,
        setPosition,
    });

}
