export interface Destroyable{
    destroy: () => void;
}

export interface Updatable{
    update: (time: number, ...arg:any) => void;
}

export type Vec3 = {
    x: number;
    y: number;
    z: number;
}

export type Vec2 = {
    x:number;
    y:number;
}