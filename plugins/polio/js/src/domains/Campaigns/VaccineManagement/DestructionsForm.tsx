import { useFormikContext } from 'formik';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid } from '@mui/material';
import MESSAGES from '../../../constants/messages';
import { destructionFieldNames, DestructionForm } from './DestructionForm';

type Props = {
    round: any;
    accessor: string;
    roundIndex: number;
};

export const DestructionsForm: FunctionComponent<Props> = ({
    round,
    accessor,
    roundIndex,
}) => {
    const { formatMessage } = useSafeIntl();
    const { setFieldValue, setFieldTouched } = useFormikContext();
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
        destructionFieldNames.forEach(field => {
            setFieldTouched(
                `${accessor}.destructions[${newDestructions.length}].${field}`,
                false,
            );
        });
    }, [destructions, setFieldValue, accessor, setFieldTouched]);

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
                                roundIndex={roundIndex}
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
