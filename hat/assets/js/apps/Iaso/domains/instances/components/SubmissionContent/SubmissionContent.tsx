import React, { FunctionComponent, useMemo, useState } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TranslateIcon from '@mui/icons-material/Translate';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {
    Box,
    Button,
    Chip,
    FormControlLabel,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Switch,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    alpha,
} from '@mui/material';
import { ErrorBoundary, useSafeIntl } from 'bluesquare-components';
import { useLocale } from '../../../app/contexts/LocaleContext';
import MESSAGES from '../../messages';
import { numericValues } from '../../utils/intl';
import { getFormLanguages, pickDefaultLanguage } from '../../utils/questions';
import InstanceFileContentBasic from '../InstanceFileContentBasic';
import { Descriptor } from '../InstanceFileContentRich';
import { SubmissionFieldRow } from './SubmissionFieldRow';
import { SubmissionField } from './types';
import {
    FilteredSection,
    spansFullWidth,
    useFilteredSubmission,
    useSubmissionSections,
} from './useSubmissionSections';

/** Minimum height of the panel toolbar. */
const TOOLBAR_HEIGHT = 57;

/**
 * Whether the field at `index` has no field rendered directly below it, so its
 * bottom divider would dangle at the edge of the section. In one column that is
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
                sx={{
                    height: 20,
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: 'text.secondary',
                    backgroundColor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    '& .MuiChip-label': { px: 1 },
                }}
                label={
                    isSearching
                        ? formatMessage(MESSAGES.matchingFieldsCount, {
                              count: `${section.fields.length}`,
                              total: `${section.totalFields}`,
                          })
                        : formatMessage(
                              MESSAGES.fieldsCount,
                              numericValues({ count: section.fields.length }),
                          )
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
    const { locale: uiLocale } = useLocale();
    const [query, setQuery] = useState('');
    const [showQuestionIds, setShowQuestionIds] = useState(false);
    const [twoColumns, setTwoColumns] = useState(false);

    // the languages the form offers, and the one currently displayed. Defaults
    // to the user's UI locale when the form provides it, else the form's own
    // default language. Undefined leaves useSubmissionSections on the UI locale.
    const languages = useMemo(
        () => getFormLanguages(formDescriptor),
        [formDescriptor],
    );
    const [language, setLanguage] = useState<string | undefined>(() =>
        pickDefaultLanguage(
            languages,
            uiLocale,
            formDescriptor?.default_language,
        ),
    );

    const sections = useSubmissionSections(
        formDescriptor,
        instanceData,
        showNote,
        language,
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
                <ErrorBoundary>
                    <InstanceFileContentBasic
                        fileContent={instanceData ?? {}}
                    />
                </ErrorBoundary>
            </Paper>
        );
    }

    return (
        <Paper elevation={0} variant="outlined">
            <Box
                sx={{
                    minHeight: TOOLBAR_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    px: 2.75,
                    py: 1,
                    // muted "chrome" strip so these display controls read as
                    // distinct from the answers below, not as the first field
                    backgroundColor: 'grey.100',
                    borderBottom: 1,
                    borderColor: 'divider',
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
                    sx={{
                        flexGrow: 1,
                        minWidth: 240,
                        maxWidth: 480,
                        backgroundColor: 'background.paper',
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon
                                    fontSize="small"
                                    color={isSearching ? 'primary' : 'disabled'}
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
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.75,
                        flexWrap: 'wrap',
                    }}
                >
                    {languages.length > 1 && (
                        <TextField
                            select
                            size="small"
                            value={language ?? ''}
                            onChange={event => setLanguage(event.target.value)}
                            aria-label={formatMessage(
                                MESSAGES.questionLanguage,
                            )}
                            sx={{
                                minWidth: 160,
                                backgroundColor: 'background.paper',
                                // subdued so this reads as a display control,
                                // not something demanding attention
                                '& .MuiInputBase-input': {
                                    color: 'text.secondary',
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Tooltip
                                            title={formatMessage(
                                                MESSAGES.questionLanguage,
                                            )}
                                        >
                                            <TranslateIcon
                                                fontSize="small"
                                                sx={{ color: 'text.secondary' }}
                                            />
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }}
                        >
                            {languages.map(lang => (
                                <MenuItem key={lang} value={lang}>
                                    {lang === 'default'
                                        ? formatMessage(
                                              MESSAGES.defaultLanguage,
                                          )
                                        : lang}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
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
                            <Typography
                                variant="body2"
                                sx={{ color: 'text.secondary' }}
                            >
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
                        sx={theme => ({
                            // segmented control: blue icons, active filled blue
                            '& .MuiToggleButton-root': {
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha(
                                        theme.palette.primary.main,
                                        0.08,
                                    ),
                                },
                                '&.Mui-selected': {
                                    color: theme.palette.primary.contrastText,
                                    backgroundColor: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor:
                                            theme.palette.primary.dark,
                                    },
                                },
                            },
                        })}
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
                                  ...numericValues({ count: matchCount }),
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
                            {section.fields.map((field, index) => (
                                <SubmissionFieldRow
                                    key={`${section.id ?? 'lead'}-${field.id}`}
                                    field={field}
                                    files={files}
                                    showQuestionIds={showQuestionIds}
                                    query={query}
                                    twoColumns={twoColumns}
                                    hideBorder={hasNothingBelow(
                                        section.fields,
                                        index,
                                        twoColumns,
                                    )}
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
