import { useFormikContext } from 'formik';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid } from '@material-ui/core';
import MESSAGES from '../constants/messages';
import { DestructionForm } from './DestructionForm';

type Props = {
    round: any;
    accessor: string;
};

export const DestructionsForm: FunctionComponent<Props> = ({
    round,
    accessor,
}) => {
    const { formatMessage } = useSafeIntl();
    const { setFieldValue } = useFormikContext();
    const { destructions = [] } = round ?? {};
    const [enableRemoveButton, setEnableRemoveButton] =
        useState<boolean>(false);

    const lastIndex = destructions.length >= 1 && destructions.length - 1;

    const handleAddDestruction = () => {
        const newDestructions = [...destructions, {}];
        setFieldValue(`${accessor}.destructions`, newDestructions);
    };

    const handleRemoveLastDestruction = useCallback(() => {
        const newDestructions = [...destructions];
        newDestructions.pop();
        setFieldValue(`${accessor}.destructions`, newDestructions);
    }, [accessor, setFieldValue, destructions]);

    // determine whether to show delete button or not

    useEffect(() => {
        if (Number.isInteger(lastIndex)) {
            if (lastIndex >= 0) {
                setEnableRemoveButton(true);
            } else {
                setEnableRemoveButton(false);
            }
        } else {
            setEnableRemoveButton(false);
        }
    }, [lastIndex, destructions]);

    return (
        <>
            {destructions.length > 0 &&
                destructions.map((_destruction, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Grid item xs={12} key={`destruction${index}`}>
                        <Box mt={2}>
                            <DestructionForm
                                index={index}
                                accessor={accessor}
                            />
                        </Box>
                    </Grid>
                ))}

            <Grid
                container
                item
                xs={12}
                spacing={2}
                direction="column"
                justifyContent="flex-end"
            >
                <Box mt={2} mb={2}>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-end"
                        spacing={2}
                    >
                        <Grid item>
                            <Button
                                onClick={handleAddDestruction}
                                variant="outlined"
                            >
                                {formatMessage(MESSAGES.addDestruction)}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                onClick={handleRemoveLastDestruction}
                                disabled={!enableRemoveButton}
                                variant="outlined"
                            >
                                {formatMessage(MESSAGES.removeLastDestruction)}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </>
    );
};
