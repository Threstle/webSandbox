export interface Destroyable{
    destroy: () => void;
}

export interface Updatable{
    update: (time: number) => void;
}