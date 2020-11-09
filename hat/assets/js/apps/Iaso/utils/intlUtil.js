import moment from 'moment';
/**
 * Accept options either with a string label or an intl MessageDescriptor label
 * and translate if needed
 *
 * @param {Array} options
 * @param {function} formatMessage
 * @return {Array}
 */

export const translateOptions = (options, formatMessage) =>
    options.map(option => {
        if (typeof option.label === 'object' && 'id' in option.label) {
            return {
                ...option,
                label: formatMessage(option.label),
            };
        }

        return option;
    });

/**
 * Receive a timestamp and displays it as a human readable date
 * TO-DO: display date regarding the locale
 *
 * @param {Number} timestamp
 */

export const displayDateFromTimestamp = timestamp =>
    moment.unix(timestamp).format('DD/MM/YYYY HH:mm');
