export type ParameterType = 'str' | 'bool' | 'int' | 'float' | 'list' | 'dict';

export type Pipeline = {
    id: string;
    name: string;
    currentVersion?: {
        versionNumber: string;
        parameters?: {
            type: ParameterType;
            name: string;
            code: string;
            required?: boolean;
            default?: string;
            choices?: string[];
            multiple?: boolean;
        };
    };
};
