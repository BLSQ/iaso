import React, { FunctionComponent, SetStateAction } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { userHasPermission } from '../../../users/utils';
import * as Permission from '../../../../utils/permissions';

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
    const currentUser = useCurrentUser();
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
            {userHasPermission(
                Permission.ENTITIES_DUPLICATE_WRITE,
                currentUser,
            ) && (
                <Grid container item xs={8} justifyContent="flex-end">
                    <Box
                        py={2}
                        pr={2}
                        style={{
                            display: 'inline-flex',
                        }}
                    >
                        <Box>
                            <Button
                                variant="contained"
                                color="primary"
                                data-test="fill-value-a-button"
                                onClick={() => fillValues('entity1')}
                            >
                                {formatMessage(MESSAGES.takeValuesFromA)}
                            </Button>
                        </Box>
                        <Box ml={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                data-test="fill-value-b-button"
                                onClick={() => fillValues('entity2')}
                            >
                                {formatMessage(MESSAGES.takeValuesFromB)}
                            </Button>
                        </Box>
                        <Box ml={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                data-test="reset-button"
                                onClick={() => resetSelection()}
                            >
                                {formatMessage(MESSAGES.reset)}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};
