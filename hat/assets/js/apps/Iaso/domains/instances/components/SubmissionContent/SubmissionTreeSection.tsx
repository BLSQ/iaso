import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { SubmissionContentHeader } from './SubmissionContentHeader';
import { SubmissionFieldRow } from './SubmissionFieldRow';
import {
    SubmissionField,
    SubmissionSection,
    SubmissionSectionItem,
} from './types';
import { getSectionIndent, spansFullWidth } from './useSubmissionSections';

const styles = {
    fieldsTwoColumns: {
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        columnGap: 4.5,
        py: 0.5,
    },
} satisfies SxStyles;

/**
 * Whether the field at `index` has no field rendered directly below it, so its
 * bottom divider would dangle at the edge of the run. In one column that is
 * only the last field; in two columns it is the last field of each column —
 * i.e. the last two, unless a full-width field sits between them.
 */
const hasNothingBelow = (
    fields: SubmissionField[],
    index: number,
    twoColumns: boolean,
): boolean => {
    const last = fields.length - 1;
    if (index === last) return true;
    if (!twoColumns || index !== last - 1) return false;
    // the second-to-last only dangles when it shares the bottom row with the
    // last field; a full-width field on either side takes its own row
    return (
        !spansFullWidth(fields[last].kind) &&
        !spansFullWidth(fields[index].kind)
    );
};

type Block =
    | { type: 'fields'; fields: SubmissionField[] }
    | Extract<SubmissionSectionItem, { type: 'section' }>;

/**
 * Consecutive questions share one fields block so the two-column grid can flow
 * them together; each sub section breaks the run.
 */
const toBlocks = (section: SubmissionSection): Block[] => {
    const blocks: Block[] = [];
    for (const item of section.items) {
        const previous = blocks[blocks.length - 1];
        if (item.type === 'section') {
            blocks.push(item);
        } else if (previous?.type === 'fields') {
            previous.fields.push(item.field);
        } else {
            blocks.push({ type: 'fields', fields: [item.field] });
        }
    }
    return blocks;
};

type Props = {
    section: SubmissionSection;
    files: string[];
    query: string;
    isSearching: boolean;
    showQuestionIds: boolean;
    twoColumns: boolean;
    /** Sections the user toggled away from their default expanded state */
    toggledKeys: Set<string>;
    onToggle: (key: string) => void;
};

export const SubmissionTreeSection: FunctionComponent<Props> = ({
    section,
    ...shared
}) => {
    const {
        files,
        query,
        isSearching,
        showQuestionIds,
        twoColumns,
        toggledKeys,
        onToggle,
    } = shared;
    const expandedByDefault = section.depth === 0;
    // collapsing is ignored while searching to never hide a match
    const expanded =
        isSearching || expandedByDefault !== toggledKeys.has(section.key);
    const handleToggle = useCallback(
        () => onToggle(section.key),
        [onToggle, section.key],
    );
    const blocks = useMemo(() => toBlocks(section), [section]);
    // the grid owns the side gutter in two columns, each row does in one
    const fieldsSx = {
        ...(twoColumns && styles.fieldsTwoColumns),
        pl: (twoColumns ? 2.75 : 0) + getSectionIndent(section.depth),
        pr: twoColumns ? 2.75 : 0,
    };

    return (
        <Box component="section">
            {section.label && (
                <SubmissionContentHeader
                    section={section}
                    isSearching={isSearching}
                    showQuestionIds={showQuestionIds}
                    expanded={expanded}
                    onToggle={isSearching ? undefined : handleToggle}
                />
            )}
            {expanded &&
                blocks.map(block =>
                    block.type === 'section' ? (
                        <SubmissionTreeSection
                            {...shared}
                            key={block.section.key}
                            section={block.section}
                        />
                    ) : (
                        <Box key={block.fields[0].id} sx={fieldsSx}>
                            {block.fields.map((field, index) => (
                                <SubmissionFieldRow
                                    key={field.id}
                                    field={field}
                                    files={files}
                                    showQuestionIds={showQuestionIds}
                                    query={query}
                                    twoColumns={twoColumns}
                                    hideBorder={hasNothingBelow(
                                        block.fields,
                                        index,
                                        twoColumns,
                                    )}
                                />
                            ))}
                        </Box>
                    ),
                )}
        </Box>
    );
};
