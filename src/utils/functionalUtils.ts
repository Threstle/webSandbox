export function completeAssign<T, K>(base: T, toAssign: K) {
    return Object.defineProperties(base, Object.getOwnPropertyDescriptors(toAssign)) as T & K;
}

export function addProperty<T, K extends string, V>(
    original: T,
    propName: K,
    params: { [key in K]: V },
    setCb?: (this: T, v: V) => void,
) {
    const propertyObject = {
        [`_${propName}`]: params[propName],
        get [propName](): V {
            return this[`_${propName}`];
        },
        set [propName](value: V) {
            this[`_${propName}`] = value;

            if (typeof setCb === 'function') {
                setCb.call(original, value);
            }
        },
    } as { [key in K | `_${K}`]: V };

    return completeAssign(original, propertyObject);
}

export function addFunction<T, K extends string, U, V extends any[]>(
    original: T,
    functionName: K,
    fnc: (this: T, ...args: V) => U,
) {
    const functionObject = {
        [functionName]: (...args: V) => {
            fnc.call(original, ...args);
        },
    } as { [key in K]: (...args: V) => U };

    return completeAssign(original, functionObject);
}
