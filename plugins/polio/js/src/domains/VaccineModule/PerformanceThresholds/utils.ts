export const getHumanReadableJsonLogic = (json: string) => {
    if (!json) return '';

    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    const value = parsed['and'];
    return value
        ?.map((rule, index) => {
            const operator = Object.keys(rule)[0];
            const compareTo = rule[operator][1];
            if (index === 0) {
                return `value ${operator} ${compareTo}`;
            }
            return ` & value ${operator} ${compareTo}`;
        })
        .join('');
};
