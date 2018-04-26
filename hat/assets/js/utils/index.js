
export function clone(x) {
    return JSON.parse(JSON.stringify(x));
}

export function deepEqual(a, b, ignoreNull = false) {
    if (typeof a !== 'object') {
        return a === b;
    }
    let ka = Object.keys(a);
    let kb = Object.keys(b);
    let key;
    let i;
    // ignore null and undefined values
    if (ignoreNull) {
        ka = ka.filter(x => a[x] != null);
        kb = kb.filter(x => b[x] != null);
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length !== kb.length) {
        return false;
    }
    // the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    // cheap key test
    for (i = ka.length - 1; i >= 0; i -= 1) {
        if (ka[i] !== kb[i]) {
            return false;
        }
    }
    // equivalent values for every corresponding key, and
    // possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i -= 1) {
        key = ka[i];
        if (!deepEqual(a[key], b[key], ignoreNull)) {
            return false;
        }
    }
    return true;
}

export function substituteVars(obj, subs, transform = x => x) {
    // Replace every occurence of a placeholder in a value of every property of the object.
    // The syntax for the placeholder is `${<varname>}`
    // An optional transform function can pretransform the substitute
    // e.g. `{foo: "${bar}"} => {foo: "baz"}` if `subs = {bar: "baz"}`
    // We use json.stringify -> json.parse to clone the object and replace values.
    // See the test for a complete example.
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'string') {
            const match = value.match(/\$\{([a-zA-Z0-9_-]+)\}/);
            if (match) {
                const k = match[1];
                if (!subs.hasOwnProperty(k)) {
                    console.warn('Cannot find match in substitudes for value:', value);
                } else {
                    return transform(subs[k]);
                }
            }
        }
        return value;
    }));
}

export const capitalize = text => (
    text
        .split(' ')
        .map(word => (
            word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase()
        ))
        .join(' ')
);
