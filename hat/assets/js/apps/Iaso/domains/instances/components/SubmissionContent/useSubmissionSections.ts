import { useMemo } from 'react';
import { textPlaceholder } from 'bluesquare-components';
import { useLocale } from '../../../app/contexts/LocaleContext';
import { translateLabel } from '../../utils/questions';
import { Descriptor, getDisplayedValue } from '../InstanceFileContentRich';
import {
    FieldKind,
    SubmissionField,
    SubmissionSection,
    SubmissionSectionItem,
} from './types';

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

export const getSectionIndent = (depth: number): number => depth * 2;

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

const isField = (
    item: SubmissionSectionItem,
): item is { type: 'field'; field: SubmissionField } => item.type === 'field';

export const getSectionFields = (
    section: SubmissionSection,
): SubmissionField[] => section.items.filter(isField).map(item => item.field);

/**
 * Walk the (nested) form descriptor into a tree of sections mirroring its
 * groups, keeping questions and sub groups in document order. The root section
 * holds the top level questions and is rendered without a header. Repeats yield
 * a parent section holding the iteration count, with one child section per
 * iteration.
 */
export const buildSubmissionTree = (
    descriptor: Descriptor,
    data: Data,
    activeLocale: string,
    showNote = true,
): SubmissionSection => {
    const walk = (
        node: Descriptor,
        nodeData: Data,
        section: SubmissionSection,
        depth: number,
    ): void => {
        node.children
            ?.filter(child => child.name !== 'meta')
            .forEach(child => {
                const key = `${section.key}/${child.name}`;
                if (child.type === 'group') {
                    const group: SubmissionSection = {
                        key,
                        id: child.name,
                        label: labelOf(child, activeLocale),
                        depth,
                        items: [],
                    };
                    walk(child, nodeData, group, depth + 1);
                    section.items.push({ type: 'section', section: group });
                    return;
                }
                if (child.type === 'repeat') {
                    const iterations: Data[] = Array.isArray(
                        nodeData?.[child.name],
                    )
                        ? nodeData[child.name]
                        : [];
                    const repeatLabel = labelOf(child, activeLocale);
                    const repeat: SubmissionSection = {
                        key,
                        id: child.name,
                        label: repeatLabel,
                        depth,
                        items: [],
                        repeatCount: iterations.length,
                    };
                    iterations.forEach((iterationData, index) => {
                        const iteration: SubmissionSection = {
                            key: `${key}[${index}]`,
                            id: child.name,
                            label: `${repeatLabel} (${index + 1})`,
                            depth: depth + 1,
                            items: [],
                        };
                        walk(child, iterationData, iteration, depth + 2);
                        repeat.items.push({
                            type: 'section',
                            section: iteration,
                        });
                    });
                    section.items.push({ type: 'section', section: repeat });
                    return;
                }
                if (child.type === 'note' && !showNote) return;
                section.items.push({
                    type: 'field',
                    field: buildField(child, nodeData, activeLocale),
                });
            });
    };

    const root: SubmissionSection = {
        key: '',
        id: null,
        label: null,
        depth: 0,
        items: [],
    };
    walk(descriptor, data, root, 0);
    return root;
};

export const useSubmissionTree = (
    formDescriptor: Descriptor | undefined,
    instanceData: Data | undefined,
    showNote = true,
    // the form language chosen in the toolbar; falls back to the UI locale
    language?: string,
): SubmissionSection | undefined => {
    const { locale: uiLocale } = useLocale();
    const activeLocale = language ?? uiLocale;
    return useMemo(() => {
        if (!formDescriptor) return undefined;
        return buildSubmissionTree(
            formDescriptor,
            instanceData ?? {},
            activeLocale,
            showNote,
        );
    }, [formDescriptor, instanceData, activeLocale, showNote]);
};

type FilteredSubmission = {
    /** Undefined when nothing matches the query */
    tree: SubmissionSection | undefined;
    /** Number of fields matching the current query across the whole tree */
    matchCount: number;
};

const matchesQuery = (
    field: SubmissionField,
    lowerCaseQuery: string,
): boolean =>
    field.label.toLowerCase().includes(lowerCaseQuery) ||
    field.id.toLowerCase().includes(lowerCaseQuery);

const countFields = (section: SubmissionSection): number =>
    section.items.reduce(
        (count, item) =>
            count + (isField(item) ? 1 : countFields(item.section)),
        0,
    );

const filterSection = (
    section: SubmissionSection,
    lowerCaseQuery: string,
): SubmissionSection | undefined => {
    const items: SubmissionSectionItem[] = [];
    section.items.forEach(item => {
        if (isField(item)) {
            if (matchesQuery(item.field, lowerCaseQuery)) items.push(item);
            return;
        }
        const filtered = filterSection(item.section, lowerCaseQuery);
        if (filtered) items.push({ type: 'section', section: filtered });
    });
    return items.length > 0
        ? {
              ...section,
              items,
              totalFields: getSectionFields(section).length,
          }
        : undefined;
};

/**
 * Filter the tree down to the fields matching `query`, matched against both the
 * question label and the question id. Sections are kept as long as something
 * below them matches, and record their unfiltered `totalFields` so the header
 * can show "3 of 12".
 */
export const filterSubmissionTree = (
    tree: SubmissionSection | undefined,
    query: string,
): FilteredSubmission => {
    if (!tree) return { tree: undefined, matchCount: 0 };
    const trimmed = query.trim().toLowerCase();
    const filtered = trimmed ? filterSection(tree, trimmed) : tree;
    return {
        tree: filtered,
        matchCount: filtered ? countFields(filtered) : 0,
    };
};

export const useFilteredSubmissionTree = (
    tree: SubmissionSection | undefined,
    query: string,
): FilteredSubmission =>
    useMemo(() => filterSubmissionTree(tree, query), [tree, query]);
