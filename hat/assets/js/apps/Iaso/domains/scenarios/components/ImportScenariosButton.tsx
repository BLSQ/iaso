import React, { ChangeEvent, FunctionComponent, useRef } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { errorSnackBar, useSafeIntl } from 'bluesquare-components';
import { useApiScenariosCreate } from 'Iaso/api/scenarios';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import MESSAGES from '../messages';
import { parseScenarioFile } from '../utils';

type Props = {
    // in a "⋮" menu (kept mounted: the file input must outlive the menu)
    asMenuItem?: boolean;
    onClick?: () => void;
};

/** Imports scenario files (.json, several at once) into the account, one by one. */
export const ImportScenariosButton: FunctionComponent<Props> = ({
    asMenuItem = false,
    onClick,
}) => {
    const { formatMessage } = useSafeIntl();
    const input = useRef<HTMLInputElement>(null);
    const { mutateAsync: importScenario, isLoading } = useApiScenariosCreate({
        mutation: {
            meta: {
                snackSuccessMessage: MESSAGES.imported,
                useApiErrorMessage: true,
            },
        },
    });

    const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        for (const file of files) {
            const definition = await parseScenarioFile(file);
            if (definition === null) {
                openSnackBar(
                    errorSnackBar(
                        undefined,
                        formatMessage(MESSAGES.notJson, { file: file.name }),
                        null,
                    ),
                );
            } else {
                // a refused file is reported by the snackbar; the next ones are still imported
                await importScenario({
                    data: { definition },
                }).catch(() => undefined);
            }
        }
    };

    const handleClick = () => {
        input.current?.click();
        onClick?.();
    };

    return (
        <>
            <input
                ref={input}
                type="file"
                accept=".json,application/json"
                multiple
                hidden
                onChange={handleFiles}
                data-testid="import-scenarios-input"
            />
            {asMenuItem ? (
                <MenuItem disabled={isLoading} onClick={handleClick}>
                    <ListItemIcon>
                        <UploadFileIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        {formatMessage(MESSAGES.importFiles)}
                    </ListItemText>
                </MenuItem>
            ) : (
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<UploadFileIcon />}
                    disabled={isLoading}
                    onClick={handleClick}
                >
                    {formatMessage(MESSAGES.import)}
                </Button>
            )}
        </>
    );
};
