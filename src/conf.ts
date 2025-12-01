export const GENERAL = {
    realTimeRender:true
}

export const MAP = {
    size: 5000,
    startingPosX: 2500,
    startingPosY: 2500,
}

export const UI = {
    radius: 300,
    main: {
        cameraNear: 1,
        cameraFar: 1000,
        cameraClear: 0x000000,
        cameraDistance: 500,
    },
    side: {
        size: 200,
        distance: 9999999,
        cameraDistance: 1000,
    }
}

export const CAMERA = {

}

export const ROCKET = {
    fuel: 1000,
    speed: 4000,
    angularSpeed: 13,
    breakForce: 40,
    angularBreakForce: 0.3,
}

export const ASCII = {
    enabled: true,
    resolution: 300,
}

export const COLLISION = {
    minDamageMass: 0.2,
    maxDamageMass: 1000,
    minDamageSpeed: 0.4,
    maxDamageSpeed: 10,
    maxDamage: 10,
}