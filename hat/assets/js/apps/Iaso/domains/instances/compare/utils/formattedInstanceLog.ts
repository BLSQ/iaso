export type FormattedInstanceLog = {
    logA: Record<string, any> | undefined;
    logB: Record<string, any> | undefined;
    logAFiles: Record<string, string> | string[] | undefined;
    logBFiles: Record<string, string> | string[] | undefined;
    formDescriptorA:
        | Record<string, any>[]
        | Record<string, any>
        | null
        | undefined;
    formDescriptorB:
        | Record<string, any>[]
        | Record<string, any>
        | null
        | undefined;
    fields: Record<string, any>[] | undefined;
};

export const EMPTY_FORMATTED_INSTANCE_LOG = {
    logA: {},
    logB: {},
    logAFiles: {},
    logBFiles: {},
    formDescriptorA: [],
    formDescriptorB: [],
    fields: [],
} satisfies FormattedInstanceLog;

export const hasInstanceLogContent = (
    content: FormattedInstanceLog | null | undefined,
): boolean =>
    Boolean(
        content?.logA ||
        content?.logB ||
        content?.fields?.length ||
        content?.logAFiles ||
        content?.logBFiles,
    );
