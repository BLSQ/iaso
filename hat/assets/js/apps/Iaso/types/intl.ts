export type IntlMessage = {
    id: string;
    defaultMessage: string;
    values?: Record<string, any>;
};

// eslint-disable-next-line no-unused-vars
export type IntlFormatMessage = (message: IntlMessage, values?) => string;
