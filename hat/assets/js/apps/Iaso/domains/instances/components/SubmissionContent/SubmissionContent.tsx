import React, { FunctionComponent, useMemo, useState } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TranslateIcon from '@mui/icons-material/Translate';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {
    Box,
    Button,
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
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import { useLocale } from '../../../app/contexts/LocaleContext';
import MESSAGES from '../../messages';
import { getFormLanguages, pickDefaultLanguage } from '../../utils/questions';
import InstanceFileContentBasic from '../InstanceFileContentBasic';
import { Descriptor } from '../InstanceFileContentRich';
import { SubmissionContentHeader } from './SubmissionContentHeader';
import { SubmissionFieldRow } from './SubmissionFieldRow';
import { SubmissionField } from './types';
import {
    spansFullWidth,
    useFilteredSubmission,
    useSubmissionSections,
} from './useSubmissionSections';

const styles: SxStyles = {
    toolbar: {
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
    },
    searchField: {
        flexGrow: 1,
        minWidth: 240,
        maxWidth: 480,
        backgroundColor: 'background.paper',
    },
    languageField: {
        minWidth: 160,
        backgroundColor: 'background.paper',
        // subdued so this reads as a display control,
        // not something demanding attention
        '& .MuiInputBase-input': {
            color: 'text.secondary',
        },
    },
    languageControls: {
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        flexWrap: 'wrap',
    },
    languageIcon: {
        color: 'text.secondary',
    },
    showQuestionIdsLabel: {
        color: 'text.secondary',
    },
    searchResults: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        px: 2.75,
        py: 1.4,
        backgroundColor: 'action.hover',
        borderBottom: 1,
        borderColor: 'divider',
    },
    noResults: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,
        py: 6.75,
        px: 2.75,
        textAlign: 'center',
        color: 'text.secondary',
    },
    noResultsIcon: {
        fontSize: 40,
        color: 'text.disabled',
    },
    fields: {
        display: 'block',
        columnGap: 4.5,
        px: 0,
        py: 0,
    },
    fieldsTwoColumns: {
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        px: 2.75,
        py: 0.5,
    },
    toggleButtonGroup: theme => ({
        // segmented control: blue icons, active filled blue
        '& .MuiToggleButton-root': {
            color: theme.palette.primary.main,
            '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
            '&.Mui-selected': {
                color: theme.palette.primary.contrastText,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                },
            },
        },
    }),
};
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
            <Box sx={styles.toolbar}>
                <TextField
                    size="small"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Escape') setQuery('');
                    }}
                    placeholder={formatMessage(MESSAGES.searchQuestions)}
                    sx={styles.searchField}
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
                <Box sx={styles.languageControls}>
                    {languages.length > 1 && (
                        <TextField
                            select
                            size="small"
                            value={language ?? ''}
                            onChange={event => setLanguage(event.target.value)}
                            aria-label={formatMessage(
                                MESSAGES.questionLanguage,
                            )}
                            sx={styles.languageField}
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
                                                sx={styles.languageIcon}
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
                                sx={styles.showQuestionIdsLabel}
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
                        sx={styles.toggleButtonGroup}
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
                <Box sx={styles.searchResults}>
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
                            <SubmissionContentHeader
                                section={section}
                                isSearching={isSearching}
                                showQuestionIds={showQuestionIds}
                            />
                        )}
                        <Box
                            sx={
                                [
                                    styles.fields,
                                    twoColumns && styles.fieldsTwoColumns,
                                ] as unknown as SxStyles
                            }
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
                <Box sx={styles.noResults}>
                    <SearchIcon sx={styles.noResultsIcon} />
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
