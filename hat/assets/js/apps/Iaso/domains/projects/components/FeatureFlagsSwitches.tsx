import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, Table } from 'bluesquare-components';
import { FeatureFlag } from '../types/featureFlag';
import { useFeatureFlagColumns } from '../config';

const styles = theme => ({
    container: {
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
        },
        '& .MuiTableContainer-root': {
            maxHeight: '58vh',
            overflow: 'auto',
            border: `1px solid ${theme.palette.border.main}`,
        },
        marginTop: theme.spacing(2),
        maxHeight: '60vh',
        overflow: 'scroll',
    },
});

type Props = {
    featureFlags: FeatureFlag[];
    featureFlagsValues: (string | number)[];
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
    isLoading;
};

const useStyles = makeStyles(styles);
export const FeatureFlagsSwitches: React.FunctionComponent<Props> = ({
    featureFlags,
    featureFlagsValues,
    handleChange,
    isLoading,
}) => {
    const classes = useStyles();
    const setFeatureFlag = useCallback(
        (featureFlag: FeatureFlag, isChecked: boolean) => {
            const newFeatureFlags = [...featureFlags];
            if (!isChecked) {
                const permIndex = newFeatureFlags.findIndex(item => {
                    return item.code === featureFlag.code;
                });
                newFeatureFlags.splice(permIndex, 1);
            } else {
                newFeatureFlags.push({
                    id: featureFlag.id,
                    code: featureFlag.code,
                    name: featureFlag.name,
                    created_at: featureFlag.created_at,
                    updated_at: featureFlag.updated_at,
                    description: featureFlag.description,
                });
            }
            handleChange(newFeatureFlags);
        },
        [featureFlags, handleChange],
    );

    const columns = useFeatureFlagColumns(setFeatureFlag, featureFlagsValues);

    return (
        <Box className={classes.container}>
            {isLoading && <LoadingSpinner />}
            {/* @ts-ignore */}
            <Table
                columns={columns}
                data={featureFlags}
                showPagination={false}
                countOnTop={false}
                marginTop={false}
                marginBottom={false}
                extraProps={{
                    columns,
                }}
                elevation={0}
            />
        </Box>
    );
};
