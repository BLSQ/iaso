import { textPlaceholder } from 'bluesquare-components';

export const textOrPlaceholder = (text?: string): string => {
    if (text && text.length > 0) {
        return text;
    }

    return textPlaceholder;
};
