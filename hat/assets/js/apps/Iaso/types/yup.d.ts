import 'yup';

declare module 'yup' {
    interface StringSchema {
        isMultiSelectValid(
            formatMessage: (message: any) => string,
        ): StringSchema;
    }
}
