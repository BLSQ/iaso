import React, { FunctionComponent, useEffect, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SearchField } from 'Iaso/api/scenarios';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { searchAllowsRegistering } from '../utils';

const styles: SxStyles = {
    root: { display: 'flex', flexDirection: 'column', gap: 1.5 },
    fields: { display: 'flex', flexDirection: 'column', gap: 1.5 },
    action: { alignSelf: 'flex-start' },
};

type Props = {
    questions: SearchField[];
    preventAdd: boolean;
    // the search applied (what prefills the form); undefined: not searched yet
    search: Record<string, string> | undefined;
    onSearch: (search: Record<string, string>) => void;
    showTechnicalNames: boolean;
};

/**
 * The search the app asks for before registering (the entity type's duplicate search): typed here, a QR code's text
 * too. Nothing is found (the scenario's entity isn't registered yet): the values prefill the registration form.
 */
export const SearchBeforeRegistering: FunctionComponent<Props> = ({
    questions,
    preventAdd,
    search,
    onSearch,
    showTechnicalNames,
}) => {
    const { formatMessage } = useSafeIntl();
    const [draft, setDraft] = useState<Record<string, string>>(search ?? {});
    useEffect(() => setDraft(search ?? {}), [search]);

    const allowed =
        search !== undefined &&
        searchAllowsRegistering(questions, preventAdd, search);
    return (
        <Box sx={styles.root}>
            <Typography variant="subtitle1">
                {formatMessage(MESSAGES.searchBeforeRegistering)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {formatMessage(MESSAGES.searchBeforeRegisteringHelp)}
            </Typography>
            <Box sx={styles.fields}>
                {questions.map(question => (
                    <TextField
                        key={question.name}
                        label={
                            showTechnicalNames
                                ? `${question.label} (${question.name})`
                                : question.label
                        }
                        value={draft[question.name] ?? ''}
                        onChange={event =>
                            setDraft({
                                ...draft,
                                [question.name]: event.target.value,
                            })
                        }
                        required={preventAdd}
                        // a QR code's text can be long, or on several lines
                        multiline
                        maxRows={4}
                    />
                ))}
            </Box>
            <Button
                sx={styles.action}
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => onSearch(draft)}
            >
                {formatMessage(MESSAGES.searchButton)}
            </Button>
            {search !== undefined && (
                <Alert severity={allowed ? 'success' : 'warning'}>
                    {formatMessage(
                        allowed
                            ? MESSAGES.searchNothingFound
                            : MESSAGES.searchNeedsEveryQuestion,
                    )}
                </Alert>
            )}
        </Box>
    );
};
