import React, { FunctionComponent, ReactNode, useMemo } from 'react';
import { Box, Grid, Theme, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';
import {
    AddButton,
    IntlMessage,
    MENU_HEIGHT_WITH_TABS,
    useSafeIntl,
} from 'bluesquare-components';
import { useGetDosesPerVial } from '../hooks/api/useGetDosesPerVial';
import { DropdownOptions } from 'Iaso/types/utils';

export const useSharedStyles = makeStyles({
    scrollableForm: {
        height: `calc(100vh - ${MENU_HEIGHT_WITH_TABS + 250}px)`,
        overflowY: 'auto',
    },
});

type Props = {
    className?: string;
    onClick: () => void;
    children: ReactNode;
    titleMessage: IntlMessage;
    buttonMessage: IntlMessage | null;
};

export const MultiFormTab: FunctionComponent<Props> = ({
    className,
    onClick,
    children,
    titleMessage,
    buttonMessage,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useSharedStyles();
    return (
        <Box className={className}>
            <Box mb={4}>
                <Grid container justifyContent="space-between">
                    <Typography variant="h5">
                        {formatMessage(titleMessage)}
                    </Typography>
                    {buttonMessage && (
                        <Box mr={2}>
                            <AddButton
                                message={buttonMessage}
                                onClick={onClick}
                            />
                        </Box>
                    )}
                </Grid>
            </Box>
            <Box className={classes.scrollableForm}>{children}</Box>
        </Box>
    );
};
export const usePaperStyles = makeStyles((theme: Theme) => ({
    paper: {
        padding: theme.spacing(4, 2, 2, 4),
        marginBottom: theme.spacing(4),
        // @ts-ignore
        border: `1px solid ${theme.palette.mediumGray.main}`,
        width: 'calc(100% - 64px)',
        boxShadow:
            '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 1px 0px rgba(0,0,0,0.1)',
    },
    markedForDeletion: {
        '&  label.MuiInputLabel-root': {
            backgroundColor: `${theme.palette.grey['200']} !important`,
        },
        // Couldn't apply the color with bgColor and sx. Also theme.palette.grey['200'] woudln't work either
        backgroundColor: `${theme.palette.grey['200']} !important`,
    },
    container: { display: 'inline-flex', width: '100%' },
}));
export const grayText = { color: grey[500] };

export const useDosesPerVialDropDownForVaccine = (
    vaccine?: 'bOPV' | 'nOPV2' | 'mOPV2',
): DropdownOptions<number>[] => {
    const { data: dosesPerVialReference } = useGetDosesPerVial();
    return useMemo(() => {
        const options =
            vaccine && dosesPerVialReference
                ? dosesPerVialReference[vaccine]
                : [];
        return options.map((option: number) => ({
            label: `${option}`,
            value: option,
        }));
    }, [dosesPerVialReference, vaccine]);
};

export const useEmptyPreAlert = (
    dosesPerVaccineOptions: DropdownOptions<number>[],
) => {
    return useMemo(() => {
        return {
            date_pre_alert_reception: undefined,
            po_number: undefined,
            estimated_arrival_time: undefined,
            expiration_date: undefined,
            doses_shipped: undefined,
            doses_per_vial:
                dosesPerVaccineOptions.length === 1
                    ? dosesPerVaccineOptions[0].value
                    : undefined,
            lot_numbers: undefined,
            to_delete: false,
            id: undefined,
            can_edit: true,
        };
    }, [dosesPerVaccineOptions]);
};
export const useEmptyArrivalReport = (
    dosesPerVaccineOptions: DropdownOptions<number>[],
) => {
    return useMemo(() => {
        return {
            report_date: undefined,
            po_number: undefined,
            lot_numbers: undefined,
            expiration_date: undefined,
            doses_shipped: undefined,
            doses_received: undefined,
            to_delete: false,
            can_edit: true,
            doses_per_vial:
                dosesPerVaccineOptions.length === 1
                    ? dosesPerVaccineOptions[0].value
                    : undefined,
        };
    }, [dosesPerVaccineOptions]);
};
