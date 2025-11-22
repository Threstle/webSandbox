import * as THREE from 'three';
import { Vec2 } from '../types';

export function rotateAround(position: Vec2, rotation: number, pivot: Vec2 = { x: 0, y: 0 }): Vec2 {

    const aPrime = {
        x: position.x - pivot.x,
        y: position.y - pivot.y,
    }

    return {
        x: aPrime.x * Math.cos(rotation) - aPrime.y * Math.sin(rotation) + pivot.x,
        y: aPrime.x * Math.sin(rotation) + aPrime.y * Math.cos(rotation) + pivot.y,
    }

}
