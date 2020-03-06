/**
 * Accept options either with a string label or an intl MessageDescriptor label
 * and translate if needed
 *
 * @param {Array} options
 * @param {function} formatMessage
 * @return {Array}
 */

export function translateOptions(options, formatMessage) {
    return options.map((option) => {
        if (typeof option.label === 'object' && 'id' in option.label) {
            return {
                ...option,
                label: formatMessage(option.label),
            };
        }

        return option;
    });
}
