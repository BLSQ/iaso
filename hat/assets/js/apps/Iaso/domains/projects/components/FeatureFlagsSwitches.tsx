import React, { useCallback, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, Table } from 'bluesquare-components';
import { useFeatureFlagColumns } from '../config';
import { FeatureFlag } from '../types/featureFlag';

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
    },
});

type Props = {
    featureFlags: FeatureFlag[];
    projectFeatureFlagsValues: (string | number)[];
    handleChange: (newValue: any) => void;
    isLoading;
};

const useStyles = makeStyles(styles);
export const FeatureFlagsSwitches: React.FunctionComponent<Props> = ({
    featureFlags,
    projectFeatureFlagsValues,
    handleChange,
    isLoading,
}) => {
    const classes = useStyles();
    const setFeatureFlag = useCallback(
        (featureFlag: FeatureFlag, isChecked: boolean) => {
            const newFeatureFlags = [...projectFeatureFlagsValues];
            if (!isChecked) {
                const permIndex = newFeatureFlags.findIndex(item => {
                    return item === featureFlag.id;
                });
                newFeatureFlags.splice(permIndex, 1);
            } else {
                newFeatureFlags.push(featureFlag.id);
            }
            handleChange(newFeatureFlags);
        },
        [projectFeatureFlagsValues, handleChange],
    );

    const [hiddenFeatureGroups, setHiddenFeatureGroups] = useState<string[]>(
        [],
    );

    const toggleFeatureGroup = useCallback(
        group => {
            const indexOfHidden = hiddenFeatureGroups?.indexOf(group) ?? -1;
            if (indexOfHidden < 0) {
                setHiddenFeatureGroups([...hiddenFeatureGroups, group]);
            } else {
                setHiddenFeatureGroups(
                    hiddenFeatureGroups.filter((_, i) => i !== indexOfHidden),
                );
            }
        },
        [hiddenFeatureGroups, setHiddenFeatureGroups],
    );

    const columns = useFeatureFlagColumns(
        setFeatureFlag,
        toggleFeatureGroup,
        projectFeatureFlagsValues,
    );

    const featureFlagsData = useMemo(() => {
        const groupRows: string[] = [];
        // Assuming order from Back end is related to groups as well ..
        // Maybe we should make sure of that.
        return featureFlags.reduce((acc, f) => {
            const isGroupCollapsed = hiddenFeatureGroups.includes(f.category);
            if (!groupRows.includes(f.category)) {
                acc.push({
                    code: f.category,
                    group: true,
                    collapsed: isGroupCollapsed,
                });

                groupRows.push(f.category);
            }

            if (!isGroupCollapsed) {
                acc.push(f);
            }

            return acc;
        }, [] as any[]);
    }, [featureFlags, hiddenFeatureGroups]);

    return (
        <Box className={classes.container}>
            {isLoading && <LoadingSpinner />}
            <Table
                columns={columns}
                data={featureFlagsData}
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
