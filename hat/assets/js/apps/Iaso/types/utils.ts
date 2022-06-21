// Make selected properties of a type optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DropdownOptions<T> = {
    label: string;
    value: T;
};
export type ValidationError = Record<string, string> | null | undefined;
export type GenericObject = Record<string, any>;
