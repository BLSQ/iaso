import React from 'react';
import moment from 'moment';

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
    return JSON.parse(
        JSON.stringify(obj, (key, value) => {
            if (typeof value === 'string') {
                const match = value.match(/\$\{([a-zA-Z0-9_-]+)\}/);
                if (match) {
                    const k = match[1];
                    if (!subs.hasOwnProperty(k)) {
                        console.warn(
                            'Cannot find match in substitudes for value:',
                            value,
                        );
                    } else {
                        return transform(subs[k]);
                    }
                }
            }
            return value;
        }),
    );
}

export const capitalize = (text, keepEndCase = false) =>
    text
        .split(' ')
        .map(
            word =>
                word.slice(0, 1).toUpperCase() +
                (keepEndCase ? word.slice(1) : word.slice(1).toLowerCase()),
        )
        .join(' ');

export const formatThousand = number => {
    if (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return '0';
};

export const arrayToObject = arrayElement => {
    const tempResult = {};
    arrayElement.map(element => {
        tempResult[Object.keys(element)[0]] = element[Object.keys(element)[0]];
        return true;
    });
    return tempResult;
};

export const getPossibleYears = () => {
    const firstYear = 2000;
    const currentYear = new Date().getFullYear();
    const possibleYears = [];
    for (let y = currentYear; y >= firstYear; y -= 1) {
        possibleYears.push(`${y}`);
    }
    return possibleYears;
};

export const getYears = (yearsCount, offset = 0, reverse = false) => {
    const currentYear = new Date().getFullYear() + offset;
    const years = Array(yearsCount)
        .fill()
        .map((y, i) => currentYear - i);
    if (reverse) {
        return years.reverse();
    }
    return years;
};
export const NormalizeBarChartDatas = (settings, d) => {
    const newDatas = [];
    settings.map((setting, index) => {
        if (!setting.datas) {
            newDatas.push({
                key: setting.key,
                value: d[setting.key] ? d[setting.key] : 0,
                label: setting.label,
                color: setting.color,
                index,
                original: d,
            });
        } else {
            let previousValue = 0;
            setting.datas.map(subSetting => {
                const value = d[subSetting.key] ? d[subSetting.key] : 0;
                newDatas.push({
                    key: subSetting.key,
                    value,
                    label: subSetting.label,
                    color: subSetting.color,
                    previousValue,
                    index,
                    original: d,
                });
                previousValue += value;
                return null;
            });
        }
        return null;
    });
    return newDatas;
};

export const getBarChartMax = (settings, d) => {
    let higherValue = 0;
    settings.map(setting => {
        if (setting.datas) {
            let subTotal = 0;
            setting.datas.map(subSetting => {
                subTotal += d[subSetting.key];
                return null;
            });
            if (subTotal > higherValue) {
                higherValue = subTotal;
            }
        } else if (d[setting.key] > higherValue) {
            higherValue = d[setting.key];
        }
        return null;
    });
    return higherValue;
};

export const getPercentage = (totalCount, count) =>
    totalCount !== 0 ? (count * (100 / totalCount)).toFixed(2) : 0;

export const getZsName = (zoneId, zones) => {
    if (zoneId && zones.length > 0) {
        const zoneObj = zones.filter(
            z => parseInt(z.properties.pk, 10) === zoneId,
        )[0];
        if (zoneObj) {
            return zoneObj.properties.name;
        }
    }
    return '';
};

export const getWorkZoneName = (workzoneId, workzones) => {
    if (workzoneId && workzones.length > 0) {
        const workZoneObj = workzones.filter(w => w.id === workzoneId)[0];
        if (workZoneObj) {
            return workZoneObj.name;
        }
    }
    return '';
};

export const addPositionIndex = array => {
    const tempArray = [];
    if (array) {
        array.forEach((e, index) => {
            tempArray.push({
                value: e,
                position: index,
            });
        });
    }
    return tempArray;
};

export const removePositionIndex = array => {
    const tempArray = [];
    if (array) {
        array.forEach(e => {
            tempArray.push(e.value);
        });
    }
    return tempArray;
};

export const scrollTo = (selectorId, headerOffset = 0) => {
    setTimeout(() => {
        const toElement = document.getElementById(selectorId);
        if (toElement) {
            const elementPosition = toElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition - headerOffset;
            window.scrollTo({
                behavior: 'smooth',
                top: offsetPosition,
            });
        }
    }, 500);
};

export const scrollToTop = () => {
    setTimeout(() => {
        window.scrollTo({
            behavior: 'smooth',
            top: 0,
        });
    }, 500);
};

export const isCaseLocalised = kase =>
    kase.location.normalized &&
    kase.location.normalized.as !== undefined &&
    kase.location.normalized.village !== undefined;

export const userHasPermission = (
    permissions,
    currentUser,
    permissionKey,
    allowSuperUser = true,
) => {
    let hasPermission = false;
    if (
        currentUser &&
        permissions &&
        Object.getOwnPropertyNames(currentUser).length !== 0 &&
        permissions.length > 0
    ) {
        const currentPermission = permissions.find(
            p => p.codename === permissionKey,
        );
        // TODO: the API is now filtering the user permissions list so the second .find below is unnecessary
        if (
            (currentUser.is_superuser && allowSuperUser) ||
            (currentPermission &&
                currentUser.permissions.find(p => p === currentPermission.id))
        ) {
            hasPermission = true;
        }
    }
    return hasPermission;
};

export const getPourcentage = (total, value) => {
    if (total === 0) return 0;
    return 100 / (total / value);
};

export const renderCountCell = (total, value, formatMessage) => {
    const pourcentage = getPourcentage(total, value);
    return (
        <span>
            {formatThousand(total)}{' '}
            {pourcentage !== 0 && total !== 0 && (
                <span>
                    <br />
                    <span style={{ fontSize: '85%' }}>
                        ({parseFloat(pourcentage).toFixed(2)}%{' '}
                        {formatMessage({
                            defaultMessage: 'positives',
                            id: 'monitoring.label.positive',
                        })}
                        )
                    </span>
                </span>
            )}
            {pourcentage === 0 && total !== 0 && (
                <span>
                    <br />
                    <span style={{ fontSize: '85%' }}>
                        (
                        {formatMessage({
                            defaultMessage: '0 positive',
                            id: 'monitoring.label.no_positve',
                        })}
                        )
                    </span>
                </span>
            )}
        </span>
    );
};

export const isMediumUser = userLevel => userLevel > 10 && userLevel <= 30;
export const isSuperUser = userLevel => userLevel >= 40;

export const getAgeFromYear = year =>
    moment().format('YYYY') - parseInt(year, 10);

export const isFixedStructure = currentCase =>
    currentCase.user_type !== null &&
    (currentCase.user_type === 'CDTC' ||
        currentCase.user_type === 'fixed_structure');

export const getIntegerArray = size =>
    Array(size)
        .fill()
        .map((y, i) => size - i)
        .reverse();
