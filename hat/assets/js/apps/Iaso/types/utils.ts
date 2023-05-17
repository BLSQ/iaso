// Make selected properties of a type optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DropdownOptions<T> = {
    label: string;
    value: T;
    original?: Record<any, any>;
    color?: string;
};
export type DropdownOptionsWithOriginal<T> = {
    label: string;
    value: T;
    original: Record<any, any>;
};
export type ValidationError = Record<string, string> | null | undefined;
export type GenericObject = Record<string, any>;
export type Nullable<T> = T | null;
// This type might be useful when typing eg useState
export type Optional<T> = T | undefined;
export type ClassNames = Record<string, string>;
export type NameAndId = { name: string; id: number };

// https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist
// require one and only one field from a list of optional fields eg: type Example= RequireOnlyOne<BaseType, 'firstName'|'lastName'> will error if none or both `firstName and lastName have a value
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> &
            Partial<Record<Exclude<Keys, K>, undefined>>;
    }[Keys];

// https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist
// require at least one field from a list of optional fields eg: type Example= RequireAtLeastOne<BaseType, 'firstName'|'lastName'> will only error if neither firstName nor lastName have a value
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> &
            Partial<Pick<T, Exclude<Keys, K>>>;
    }[Keys];
