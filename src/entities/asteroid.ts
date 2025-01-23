import * as MATTER from 'matter-js';
import * as THREE from 'three';
import { container, GUI } from '../utils/autoinject';
import { addFunction, completeAssign } from '../utils/functionalUtils';
import { Destroyable, Updatable, Vec2, Vec3 } from './../types';
import * as Matter from 'matter-js';
import { setLabelColor, setLabelText } from '../utils/uiUtils';
export interface Asteroid extends Destroyable, Updatable {
    mesh: THREE.Mesh;
    setPosition(x: number, y: number): void;
    body: MATTER.Body;
};



export function createAsteroid(
    width: number,
    height: number
): Asteroid {


    // const asteroidShape = [
    //     "####################",
    //     "########3###########",
    //     "#####2###4##6#######",
    //     "#####1####5###7#####",
    //     "####J########8######",
    //     "###I#####9##########",
    //     "#############A######",
    //     "####H##########B####",
    //     "#####G#######C######",
    //     "#######F###D########",
    //     "#########E##########",
    // ];

    const asteroidShape = [
        // [
        //     "################",
        //     "######1#########",
        //     "##6#######2#####",
        //     "################",
        //     "##5#######3#####",
        //     "######4#########",
        //     "################",
        // ],
        // [
        //     "################",
        //     "#####1#########",
        //     "##7###2#######",
        //     "################",
        //     "##6###3#######",
        //     "########4#####",
        //     "#####5##########",
        // ],
        // [
        //     "###1############",
        //     "##7#####2#######",
        //     "6###3###########",
        //     "##4#############",
        //     "5###############",
        //     "################",
        // ],
        [
            "1###############",
            "###7#####2######",
            "################",
            "##6#############",
            "###############",
            "#####5##########",
            "################",
            "################",
            "################",
            "################",
            "4#########3#####",
        ],
    ];
    const amp = 10;
    const vertices: THREE.Vector2[] = [];

    const key = {
        1: 0,
        2: 1,
        3: 2,
        4: 3,
        5: 4,
        6: 5,
        7: 6,
        8: 7,
        9: 8,
        A: 9,
        B: 10,
        C: 11,
        D: 12,
        E: 13,
        F: 14,
        G: 15,
        H: 16,
        I: 17,
        J: 18,
        K: 19,
        L: 20,
        M: 21,
        N: 22,
        O: 23,
        P: 24,
        Q: 25,
        R: 26,
        S: 27,
        T: 28,
        U: 29,
        V: 30,
        W: 31,
        X: 32,
        Y: 33,
        Z: 34,
    }


    const shape = new THREE.Shape();

    const randomShapeTemplate = asteroidShape[Math.floor(Math.random() * asteroidShape.length)];


    let bounds = [0, 0, 0, 0];
    // const shapeRatio = asteroidShape.length / asteroidShape[0].length;
    randomShapeTemplate.forEach((row, y) => {
        const rowArray = row.split('');
        rowArray.forEach((char, x) => {
            
            if (char !== '#') {

                bounds = [
                    Math.min(bounds[0], x),
                    Math.min(bounds[1], y),
                    Math.max(bounds[2], x),
                    Math.max(bounds[3], y),
                ]

                vertices[key[char as keyof typeof key]] = new THREE.Vector2(x, y);
            }
        });
    })

    vertices.forEach(v => {
        v.x -= bounds[2]/2;
        v.y -= bounds[3]/2;
    });

    shape.setFromPoints(vertices);
    const geometry = new THREE.ShapeGeometry(shape);

    const bodyVertices = vertices.map(v => v.clone().multiplyScalar(20));
    // const geometry = new THREE.BoxGeometry(100, 100, 1);

    const material = new THREE.MeshBasicMaterial({ color: 0x00FF00, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(
        geometry,
        material
    );
    mesh.scale.set(20, 20, 1);
    // mesh.scale.set(amp,amp,1);

    const meshDebug = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0xFF0000, side: THREE.DoubleSide })
    );

    mesh.add(meshDebug);

    // const body = MATTER.Bodies.rectangle(0, 0, 100, 100)

    const body = MATTER.Bodies.fromVertices(0, 0, [bodyVertices], {
        friction: 1,
        mass: 10,
    });


    // MATTER.Body.setAngularVelocity(body, Math.random() * 1);
    // MATTER.Body.setVelocity(body, new THREE.Vector2(Math.random() * 1, Math.random() * 1));

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
