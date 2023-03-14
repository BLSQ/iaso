import React, { FunctionComponent, SetStateAction } from 'react';
import { Box, Button, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from './messages';

type Props = {
    onlyShowUnmatched: boolean;
    // eslint-disable-next-line no-unused-vars
    setOnlyShowUnmatched: (value: SetStateAction<boolean>) => void;
    // eslint-disable-next-line no-unused-vars
    fillValues: (entity: 'entity1' | 'entity2') => void;
    resetSelection: () => void;
};

export const DuplicateDetailsTableButtons: FunctionComponent<Props> = ({
    onlyShowUnmatched,
    setOnlyShowUnmatched,
    fillValues,
    resetSelection,
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
                        label={MESSAGES.showUnmatchedOnly}
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
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => fillValues('entity1')}
                        >
                            {formatMessage(MESSAGES.takeValuesFromA)}
                        </Button>
                    </Box>
                    <Box ml={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => fillValues('entity2')}
                        >
                            {formatMessage(MESSAGES.takeValuesFromB)}
                        </Button>
                    </Box>
                    <Box ml={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => resetSelection()}
                        >
                            {formatMessage(MESSAGES.reset)}
                        </Button>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};
