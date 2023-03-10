import React, { FunctionComponent, SetStateAction } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from './messages';

type Props = {
    onlyShowUnmatched: boolean;
    // eslint-disable-next-line no-unused-vars
    setOnlyShowUnmatched: (value: SetStateAction<boolean>) => void;
};

export const DuplicateDetailsTableButtons: FunctionComponent<Props> = ({
    onlyShowUnmatched,
    setOnlyShowUnmatched,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Grid container>
            <Grid item xs={4}>
                <Box pb={2} pt={2} pl={2}>
                    <InputComponent
                        withMarginTop={false}
                        type="checkbox"
                        value={onlyShowUnmatched}
                        keyValue="onlyShowUnmatched"
                        onChange={(_key, value) => {
                            setOnlyShowUnmatched(value);
                        }}
                        label={MESSAGES.showIgnored}
                    />
                </Box>
            </Grid>
            <Grid container item xs={8} justifyContent="flex-end">
                <Box
                    pb={2}
                    pt={2}
                    pr={2}
                    style={{
                        display: 'inline-flex',
                    }}
                >
                    <Box>
                        <Button variant="contained" color="primary">
                            {formatMessage(MESSAGES.takeValuesFromA)}
                        </Button>
                    </Box>
                    <Box ml={2}>
                        <Button variant="contained" color="primary">
                            {formatMessage(MESSAGES.takeValuesFromA)}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};
