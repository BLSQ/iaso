import { useMemo } from 'react';
import { textPlaceholder } from 'bluesquare-components';
import { useLocale } from '../../../app/contexts/LocaleContext';
import { translateLabel } from '../../utils/questions';
import { Descriptor, getDisplayedValue } from '../InstanceFileContentRich';
import { FieldKind, SubmissionField, SubmissionSection } from './types';

type Data = Record<string, any>;

/**
 * Map an XLSForm question type onto the visual treatment its value gets.
 */
export const getFieldKind = (descriptor: Descriptor): FieldKind => {
    switch (descriptor.type) {
        case 'date':
        case 'today':
        case 'datetime':
        case 'dateTime':
        case 'time':
        // ODK collection metadata timestamps (start/end of the submission)
        case 'start':
        case 'end':
            return 'date';
        case 'integer':
        case 'int':
        case 'decimal':
        case 'range':
            return 'number';
        case 'select_one':
        case 'select one':
            return 'choice';
        case 'select_multiple':
        case 'select multiple':
        case 'select_all_that_apply':
        case 'select all that apply':
            return 'multi';
        case 'photo':
        case 'image':
            return 'photo';
        case 'file':
        case 'audio':
        case 'video':
            return 'file';
        case 'geopoint':
        case 'geoshape':
        case 'geotrace':
            return 'gps';
        case 'note':
            return 'note';
        case 'calculate':
            return 'calculated';
        case 'deviceid':
        case 'subscriberid':
        case 'simserial':
        case 'phonenumber':
            return 'meta';
        default:
            return 'text';
    }
};

/**
 * gps / photo / file answers are laid out as blocks (label above value); of
 * those only the gps map is wide enough to span the full panel width. Photos
 * and files are capped and flow within the two-column grid.
 */
export const spansFullWidth = (kind: FieldKind): boolean => kind === 'gps';

const isEmptyValue = (raw: unknown, displayed: string): boolean =>
    raw === undefined ||
    raw === null ||
    raw === '' ||
    displayed === textPlaceholder;

const labelOf = (descriptor: Descriptor, activeLocale: string): string => {
    if (!('label' in descriptor) || !descriptor.label) return descriptor.name;
    const cleaned = translateLabel(descriptor.label, activeLocale)
        .replace(/(<([^>]+)>)/gi, '') // strip html tags
        // ODK metadata labels interpolate the value, e.g.
        // "Survey start time: ${start}"; drop the placeholder and any now
        // dangling separator so the label reads cleanly
        .replace(/\$\{[^}]*\}/g, '')
        .replace(/[\s:–-]+$/, '')
        .trim();
    return cleaned || descriptor.name;
};

const buildField = (
    descriptor: Descriptor,
    data: Data,
    activeLocale: string,
): SubmissionField => {
    const rawValue = data?.[descriptor.name];
    const value = getDisplayedValue(descriptor, data, activeLocale);
    return {
        id: descriptor.name,
        label: labelOf(descriptor, activeLocale),
        kind: getFieldKind(descriptor),
        value,
        rawValue,
        empty: isEmptyValue(rawValue, value),
        descriptor,
        tooltip: descriptor.bind?.calculate,
    };
};

/**
 * Walk the (nested) form descriptor and flatten it into a list of sections.
 *
 * Questions are assigned to the most recently opened section, so a section runs
 * until the next group header — the same document order the form is filled in.
 * Top level questions appearing before any group land in a leading section with
 * a `null` id, which the panel renders without a header. Nested groups get a
 * bigger `depth` so the panel can indent their header, and repeats yield one
 * section per iteration.
 */
export const buildSubmissionSections = (
    descriptor: Descriptor,
    data: Data,
    activeLocale: string,
    showNote = true,
): SubmissionSection[] => {
    const sections: SubmissionSection[] = [
        { id: null, label: null, depth: 0, fields: [] },
    ];

    const walk = (node: Descriptor, nodeData: Data, depth: number): void => {
        node.children
            ?.filter(child => child.name !== 'meta')
            .forEach(child => {
                if (child.type === 'group') {
                    sections.push({
                        id: child.name,
                        label: labelOf(child, activeLocale),
                        depth,
                        fields: [],
                    });
                    walk(child, nodeData, depth + 1);
                    return;
                }
                if (child.type === 'repeat') {
                    const iterations: Data[] = Array.isArray(
                        nodeData?.[child.name],
                    )
                        ? nodeData[child.name]
                        : [];
                    const baseLabel = labelOf(child, activeLocale);
                    iterations.forEach((iterationData, index) => {
                        sections.push({
                            id: `${child.name}-${index}`,
                            label: `${baseLabel} (${index + 1})`,
                            depth,
                            fields: [],
                        });
                        walk(child, iterationData, depth + 1);
                    });
                    return;
                }
                if (child.type === 'note' && !showNote) return;
                sections[sections.length - 1].fields.push(
                    buildField(child, nodeData, activeLocale),
                );
            });
    };

    walk(descriptor, data, 0);

    // drop the leading section when the form opens directly on a group
    return sections.filter(
        section => section.id !== null || section.fields.length > 0,
    );
};

export const useSubmissionSections = (
    formDescriptor: Descriptor | undefined,
    instanceData: Data | undefined,
    showNote = true,
    // the form language chosen in the toolbar; falls back to the UI locale
    language?: string,
): SubmissionSection[] => {
    const { locale: uiLocale } = useLocale();
    const activeLocale = language ?? uiLocale;
    return useMemo(() => {
        if (!formDescriptor) return [];
        return buildSubmissionSections(
            formDescriptor,
            instanceData ?? {},
            activeLocale,
            showNote,
        );
    }, [formDescriptor, instanceData, activeLocale, showNote]);
};

export type FilteredSection = SubmissionSection & {
    /** How many fields the section holds when no search is active */
    totalFields: number;
};

export type FilteredSubmission = {
    sections: FilteredSection[];
    /** Number of fields matching the current query across all sections */
    matchCount: number;
};

const matchesQuery = (
    field: SubmissionField,
    lowerCaseQuery: string,
): boolean =>
    field.label.toLowerCase().includes(lowerCaseQuery) ||
    field.id.toLowerCase().includes(lowerCaseQuery);

/**
 * Filter sections down to the fields matching `query`, matched against both the
 * question label and the question id. Sections left without any match are
 * dropped, but survivors keep their original field count so the section header
 * can show "3 of 12".
 */
export const filterSubmissionSections = (
    sections: SubmissionSection[],
    query: string,
): FilteredSubmission => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
        const all = sections.map(section => ({
            ...section,
            totalFields: section.fields.length,
        }));
        return {
            sections: all,
            matchCount: all.reduce((n, s) => n + s.fields.length, 0),
        };
    }
    const filtered: FilteredSection[] = [];
    sections.forEach(section => {
        const fields = section.fields.filter(field =>
            matchesQuery(field, trimmed),
        );
        if (fields.length > 0) {
            filtered.push({
                ...section,
                fields,
                totalFields: section.fields.length,
            });
        }
    });
    return {
        sections: filtered,
        matchCount: filtered.reduce((n, s) => n + s.fields.length, 0),
    };
};

export const useFilteredSubmission = (
    sections: SubmissionSection[],
    query: string,
): FilteredSubmission =>
    useMemo(() => filterSubmissionSections(sections, query), [sections, query]);
