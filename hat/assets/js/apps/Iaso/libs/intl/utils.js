export const patchIntl = intl => {
    const intlCopy = { ...intl };
    const intlOriginal = { ...intl };
    const formatMessage = message => {
        if (message && message.id && message.defaultMessage) {
            return intlOriginal.formatMessage(message);
        }
        console.warn('Warning: Message object is not defined properly!');
        return null;
    };
    intlCopy.formatMessage = formatMessage;
    return intlCopy;
};
