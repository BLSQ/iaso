import { Descriptor } from '../InstanceFileContentRich';

/**
 * The visual treatment a value gets in the submission panel.
 * Derived from the XLSForm question type in `getFieldKind`.
 */
export type FieldKind =
    | 'text'
    | 'number'
    | 'date'
    | 'choice'
    | 'multi'
    | 'photo'
    | 'file'
    | 'gps'
    | 'note'
    | 'calculated'
    | 'meta';

export type SubmissionField = {
    /** Question id (descriptor.name), shown when "show question ids" is on */
    id: string;
    label: string;
    kind: FieldKind;
    /** Display value, already translated/resolved for choices */
    value: string;
    /** Raw value, used for tooltips and for resolving file paths */
    rawValue: unknown;
    empty: boolean;
    descriptor: Descriptor;
    /** Only set for `calculated`, holds the calculate expression */
    tooltip?: string;
};

export type SubmissionSection = {
    /** Group id, or `null` for the lead fields that precede any group */
    id: string | null;
    label: string | null;
    /** Nesting depth: 0 for top level groups, >0 for groups within groups */
    depth: number;
    fields: SubmissionField[];
};
