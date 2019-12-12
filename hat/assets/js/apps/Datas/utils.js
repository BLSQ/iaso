const getMergedPatient = (itemA, itemB) => {
    const mergedItem = {};
    const conflicts = [];
    const hasconflict = (key) => {
        if (key.toLowerCase() !== 'id') {
            const newConflict = {
                key,
                value: undefined,
            };
            conflicts.push(newConflict);
        }
        mergedItem[key] = '';
    };
    if (itemA) {
        Object.keys(itemA).forEach((key) => {
            if (!itemA[key] && !itemB[key]) {
                mergedItem[key] = itemA[key];
            } else {
                switch (typeof itemA[key]) {
                    case 'boolean':
                    case 'number':
                        if (itemA[key] === itemB[key]) {
                            mergedItem[key] = itemA[key];
                        } else {
                            hasconflict(key);
                        }
                        break;
                    case 'string':
                        if (itemA && itemB
                            && itemA[key] && itemB[key]
                            && (itemA[key].toLowerCase() === itemB[key].toLowerCase())) {
                            mergedItem[key] = itemA[key];
                        } else {
                            hasconflict(key);
                        }
                        break;
                    case 'object':
                        if (Array.isArray(itemA[key])) {
                            mergedItem[key] = itemA[key].concat(itemB[key]);
                        } else if ((key === 'death' && (itemA[key].dead !== itemB[key].dead)) || (!itemA[key] || !itemB[key])) {
                            hasconflict(key);
                        } else {
                            mergedItem[key] = getMergedPatient(itemA[key], itemB[key]).mergedItem;
                        }
                        break;
                    default:
                        break;
                }
            }
        });
    }
    delete mergedItem.similar_patients;
    return {
        mergedItem,
        conflicts,
    };
};

export default getMergedPatient;
