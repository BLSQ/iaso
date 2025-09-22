export type ParameterType = 'str' | 'bool' | 'int' | 'float' | 'list' | 'dict';

export type Parameter = {
    type: ParameterType;
    name: string;
    code: string;
    required?: boolean;
    default?: string;
    choices?: string[];
    multiple?: boolean;
};

export type Pipeline = {
    id: string;
    name: string;
    code: string;
    currentVersion?: {
        id: string;
        versionNumber: string;
        parameters?: [Parameter];
    };
};
