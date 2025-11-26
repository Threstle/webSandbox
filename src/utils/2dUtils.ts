import * as THREE from 'three';
import { Vec2 } from '../types';

export function distance(a: Vec2, b: Vec2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

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
