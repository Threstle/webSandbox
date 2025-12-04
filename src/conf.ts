export const GENERAL = {
    realTimeRender: true
}

export const MAP = {
    size: 5000,
    startingPosX: 2500,
    startingPosY: 2500,
    safeZoneRadius: 300,
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

export const ROCKET = {
    fuel: 1000,
    speed: 4000,
    angularSpeed: 2000,
    breakForce: 40,
    angularBreakForce: 0.3,
}

export const ASCII = {
    enabled: true,
    resolution: 300,
}

export const ASTEROIDS = {
    scales: [0.5, 0.5, 0.5, 0.5, 0.5, 3, 4, 3, 1, 2, 4, 5, 5, 6, 7, 15],
    baseScale: 0.1,
    amount: 300,
}

export const COLLISION = {
    minDamageMass: 0.2,
    maxDamageMass: 1000,
    minDamageSpeed: 0.4,
    maxDamageSpeed: 10,
    maxDamage: 10,
}

export const LOOT = {
    scales: [0.3, 0.4, 0.5, 0.6]
}