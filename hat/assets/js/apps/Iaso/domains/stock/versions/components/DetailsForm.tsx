import React, { FunctionComponent, useState, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';

import InputComponent from 'Iaso/components/forms/InputComponent';
import { StockRulesVersion } from 'Iaso/domains/stock/types/stocks';

import { useUpdateStockRulesVersion } from 'Iaso/domains/stock/versions/hooks/requests';
import MESSAGES from '../../messages';

type Props = {
    version: StockRulesVersion;
};
// @ts-ignore
const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        '& #input-text-name': {
            paddingRight: theme.spacing(15),
        },
    },
    button: {
        position: 'absolute !important',
        right: theme.spacing(3),
        top: 26,
    },
}));
export const DetailsForm: FunctionComponent<Props> = ({ version }) => {
    const classes = useStyles();
    const [name, setName] = useState<string>(version.name);
    const { formatMessage } = useSafeIntl();
    const { mutate: updateVersion } = useUpdateStockRulesVersion();
    const handleSave = useCallback(() => {
        updateVersion({ name, id: version.id });
    }, [name, updateVersion, version.id]);
    const saveDisabled = name === version.name || name === '';
    return (
        <Box p={2} className={classes.root}>
            <InputComponent
                withMarginTop={false}
                keyValue="name"
                onChange={(_, value) => setName(value)}
                value={name}
                type="text"
                label={MESSAGES.name}
                required
            />
            <Button
                className={classes.button}
                disabled={saveDisabled}
                color="primary"
                data-test="save-name-button"
                onClick={handleSave}
                variant="contained"
            >
                {formatMessage(MESSAGES.save)}
            </Button>
        </Box>
    );
};
