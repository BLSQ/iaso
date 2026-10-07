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

export type SubmissionSectionItem =
    | { type: 'field'; field: SubmissionField }
    | { type: 'section'; section: SubmissionSection };

export type SubmissionSection = {
    /** Path from the root, unique across the tree (repeat iterations included) */
    key: string;
    /** Group id, or `null` for the root holding the top level questions */
    id: string | null;
    label: string | null;
    /** Nesting depth: 0 for top level groups, >0 for groups within groups */
    depth: number;
    /** Questions and sub sections, in document order */
    items: SubmissionSectionItem[];
    /** Only set on filtered sections: number of direct questions before filtering */
    totalFields?: number;
    /** Only set on the parent section of a repeat, holds its iteration count */
    repeatCount?: number;
};
