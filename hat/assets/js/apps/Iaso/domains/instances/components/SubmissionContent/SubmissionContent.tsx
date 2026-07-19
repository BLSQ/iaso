import React, { FunctionComponent, useState } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {
    Box,
    Button,
    Chip,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Paper,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { ErrorBoundary, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import InstanceFileContentBasic from '../InstanceFileContentBasic';
import { Descriptor } from '../InstanceFileContentRich';
import { SubmissionFieldRow } from './SubmissionFieldRow';
import {
    FilteredSection,
    useFilteredSubmission,
    useSubmissionSections,
} from './useSubmissionSections';

/**
 * Height of the panel toolbar. The detail page scrolls inside its own
 * container, so section headers stick just below the toolbar rather than below
 * the application top bar.
 */
const TOOLBAR_HEIGHT = 57;

type Props = {
    formDescriptor?: Descriptor;
    instanceData?: Record<string, any>;
    files?: string[];
    showNote?: boolean;
};

const SectionHeader: FunctionComponent<{
    section: FilteredSection;
    isSearching: boolean;
    showQuestionIds: boolean;
}> = ({ section, isSearching, showQuestionIds }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box
            sx={{
                position: 'sticky',
                top: TOOLBAR_HEIGHT,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.4,
                px: 2.75,
                py: 1.5,
                pl: 2.75 + section.depth * 2,
                backgroundColor: 'grey.100',
                borderTop: 1,
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            <Box
                sx={{
                    width: 4,
                    height: 18,
                    borderRadius: 1,
                    backgroundColor: 'primary.main',
                    flex: '0 0 auto',
                }}
            />
            <Typography
                variant="subtitle2"
                sx={{
                    color: 'primary.main',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                }}
            >
                {section.label}
            </Typography>
            <Chip
                size="small"
                variant="outlined"
                label={
                    isSearching
                        ? formatMessage(MESSAGES.matchingFieldsCount, {
                              count: `${section.fields.length}`,
                              total: `${section.totalFields}`,
                          })
                        : formatMessage(MESSAGES.fieldsCount, {
                              count: `${section.fields.length}`,
                          })
                }
            />
            {showQuestionIds && section.id && (
                <Typography
                    component="code"
                    sx={{
                        ml: 'auto',
                        fontFamily: 'monospace',
                        fontSize: 11.5,
                        color: 'text.disabled',
                    }}
                >
                    {section.id}
                </Typography>
            )}
        </Box>
    );
};

export const SubmissionContent: FunctionComponent<Props> = ({
    formDescriptor,
    instanceData,
    files = [],
    showNote = true,
}) => {
    const { formatMessage } = useSafeIntl();
    const [query, setQuery] = useState('');
    const [showQuestionIds, setShowQuestionIds] = useState(false);
    const [twoColumns, setTwoColumns] = useState(false);

    const sections = useSubmissionSections(
        formDescriptor,
        instanceData,
        showNote,
    );
    const { sections: shownSections, matchCount } = useFilteredSubmission(
        sections,
        query,
    );
    const isSearching = Boolean(query.trim());

    // without a form descriptor there is nothing to group or search on, so fall
    // back to the flat key/value rendering
    if (!formDescriptor) {
        return (
            <Paper elevation={0} variant="outlined">
                <Box
                    sx={{
                        px: 2.75,
                        py: 1.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="h5" color="primary">
                        {formatMessage(MESSAGES.submission)}
                    </Typography>
                </Box>
                <ErrorBoundary>
                    <InstanceFileContentBasic
                        fileContent={instanceData ?? {}}
                    />
                </ErrorBoundary>
            </Paper>
        );
    }

    return (
        <Paper elevation={0} variant="outlined" sx={{ overflow: 'visible' }}>
            <Box
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 3,
                    minHeight: TOOLBAR_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    px: 2.75,
                    py: 1,
                    backgroundColor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Typography variant="h5" color="primary">
                    {formatMessage(MESSAGES.submission)}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.75,
                        flexWrap: 'wrap',
                    }}
                >
                    <TextField
                        size="small"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Escape') setQuery('');
                        }}
                        placeholder={formatMessage(MESSAGES.searchQuestions)}
                        sx={{ width: 230 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon
                                        fontSize="small"
                                        color={
                                            isSearching ? 'primary' : 'disabled'
                                        }
                                    />
                                </InputAdornment>
                            ),
                            endAdornment: isSearching ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setQuery('')}
                                        aria-label={formatMessage(
                                            MESSAGES.clearSearch,
                                        )}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : undefined,
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={showQuestionIds}
                                onChange={event =>
                                    setShowQuestionIds(event.target.checked)
                                }
                            />
                        }
                        label={
                            <Typography variant="body2">
                                {formatMessage(MESSAGES.showQuestionIds)}
                            </Typography>
                        }
                    />
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={twoColumns ? 'two' : 'one'}
                        onChange={(_event, value) => {
                            if (value) setTwoColumns(value === 'two');
                        }}
                        aria-label={formatMessage(MESSAGES.layoutDensity)}
                    >
                        <ToggleButton
                            value="one"
                            aria-label={formatMessage(MESSAGES.oneColumn)}
                        >
                            <Tooltip title={formatMessage(MESSAGES.oneColumn)}>
                                <TableRowsIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton
                            value="two"
                            aria-label={formatMessage(MESSAGES.twoColumns)}
                        >
                            <Tooltip title={formatMessage(MESSAGES.twoColumns)}>
                                <ViewColumnIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {isSearching && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        px: 2.75,
                        py: 1.4,
                        backgroundColor: 'action.hover',
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="body2" color="primary">
                        {matchCount > 0
                            ? formatMessage(MESSAGES.searchResultsCount, {
                                  count: `${matchCount}`,
                                  query: query.trim(),
                              })
                            : formatMessage(MESSAGES.noQuestionsMatch, {
                                  query: query.trim(),
                              })}
                    </Typography>
                    <Button size="small" onClick={() => setQuery('')}>
                        {formatMessage(MESSAGES.clearSearch)}
                    </Button>
                </Box>
            )}

            <ErrorBoundary>
                {shownSections.map(section => (
                    <Box component="section" key={section.id ?? 'lead'}>
                        {section.label && (
                            <SectionHeader
                                section={section}
                                isSearching={isSearching}
                                showQuestionIds={showQuestionIds}
                            />
                        )}
                        <Box
                            sx={{
                                display: twoColumns ? 'grid' : 'block',
                                gridTemplateColumns: twoColumns
                                    ? { xs: '1fr', md: '1fr 1fr' }
                                    : undefined,
                                columnGap: 4.5,
                                px: twoColumns ? 2.75 : 0,
                                py: twoColumns ? 0.5 : 0,
                            }}
                        >
                            {section.fields.map(field => (
                                <SubmissionFieldRow
                                    key={`${section.id ?? 'lead'}-${field.id}`}
                                    field={field}
                                    files={files}
                                    showQuestionIds={showQuestionIds}
                                    query={query}
                                    twoColumns={twoColumns}
                                />
                            ))}
                        </Box>
                    </Box>
                ))}
            </ErrorBoundary>

            {isSearching && matchCount === 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.25,
                        py: 6.75,
                        px: 2.75,
                        textAlign: 'center',
                        color: 'text.secondary',
                    }}
                >
                    <SearchIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.noQuestionsMatch, {
                            query: query.trim(),
                        })}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};
