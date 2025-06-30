import React, { useCallback, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, Table } from 'bluesquare-components';
import InputComponent, {
    InputComponentType,
} from 'Iaso/components/forms/InputComponent';
import { useFeatureFlagColumns } from '../config';
import { FeatureFlag, ProjectFeatureFlag } from '../types/featureFlag';

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
    projectFeatureFlags: ProjectFeatureFlag[];
    onFeatureFlagsChanged: (newValue: ProjectFeatureFlag[]) => void;
    isLoading: boolean;
};

const useStyles = makeStyles(styles);

const featureFlagToProjectFeatureFlag = (
    ff: FeatureFlag,
): ProjectFeatureFlag => {
    const configuration: Record<string, any> = {};
    if (ff.configuration_schema != null) {
        Object.entries(ff.configuration_schema).forEach(([k, conf]) => {
            configuration[k] = conf.default;
        });
    }
    return {
        ...ff,
        configuration,
    };
};

const translateType = (type: string): InputComponentType => {
    switch (type.toLowerCase()) {
        case 'int':
        case 'long':
        case 'double':
        case 'float':
        case 'decimal':
            return 'number';
        case 'url':
        case 'str':
        case 'string':
            return 'text';
        default:
            return 'text';
    }
};

export const useFeatureFlagConfiguration = (
    ff: FeatureFlag,
    onFeatureFlagChanged: (changed: ProjectFeatureFlag) => void,
    pff?: ProjectFeatureFlag,
) => {
    if (ff.configuration_schema == null) {
        return null;
    }
    const onConfigurationChanged = (key: string, value: any) => {
        let f: ProjectFeatureFlag;
        if (pff != null) {
            f = pff;
        } else {
            f = featureFlagToProjectFeatureFlag(ff);
        }
        onFeatureFlagChanged({
            ...f,
            configuration: { ...(f.configuration || {}), [key]: value },
        });
    };
    return (
        <div key={`${ff.code}_configurations`} id={`${ff.code}_configurations`}>
            {Object.entries(ff.configuration_schema).map(([confKey, conf]) => {
                return (
                    <>
                        <InputComponent
                            keyValue={confKey}
                            key={`${ff.code}_${confKey}`}
                            onChange={(key, value) =>
                                onConfigurationChanged(key, value)
                            }
                            value={
                                pff?.configuration?.[confKey] ?? conf.default
                            }
                            type={translateType(conf.type)}
                            labelString={`${confKey} (${conf.type})`}
                            required
                        />
                        <p style={{ fontStyle: 'italic' }}>
                            {conf.description}
                        </p>
                    </>
                );
            })}
        </div>
    );
};

export const FeatureFlagsSwitches: React.FunctionComponent<Props> = ({
    featureFlags,
    projectFeatureFlags,
    onFeatureFlagsChanged,
    isLoading,
}) => {
    const classes = useStyles();
    const setFeatureFlag = useCallback(
        (featureFlag: FeatureFlag, isChecked: boolean) => {
            const newFeatureFlags = [...projectFeatureFlags];
            if (!isChecked) {
                const permIndex = newFeatureFlags.findIndex(item => {
                    return item.id === featureFlag.id;
                });
                newFeatureFlags.splice(permIndex, 1);
            } else {
                newFeatureFlags.push(
                    featureFlagToProjectFeatureFlag(featureFlag),
                );
            }
            onFeatureFlagsChanged(newFeatureFlags);
        },
        [projectFeatureFlags, onFeatureFlagsChanged],
    );

    const [visibleFeatureGroups, setVisibleFeatureGroups] = useState<string[]>(
        [],
    );

    const toggleFeatureGroup = useCallback(
        group => {
            const indexOfVisible = visibleFeatureGroups?.indexOf(group) ?? -1;
            if (indexOfVisible < 0) {
                setVisibleFeatureGroups([...visibleFeatureGroups, group]);
            } else {
                setVisibleFeatureGroups(
                    visibleFeatureGroups.filter((_, i) => i !== indexOfVisible),
                );
            }
        },
        [visibleFeatureGroups, setVisibleFeatureGroups],
    );

    const columns = useFeatureFlagColumns(
        setFeatureFlag,
        toggleFeatureGroup,
        projectFeatureFlags,
    );

    const featureFlagsData = useMemo(() => {
        const groupRows: string[] = [];
        return featureFlags.reduce((acc, f) => {
            const isGroupCollapsed = !visibleFeatureGroups.includes(f.category);
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
    }, [featureFlags, visibleFeatureGroups]);

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
                    SubComponent: (ff: FeatureFlag) => {
                        const pff = projectFeatureFlags.find(
                            f => f.id === ff.id,
                        );
                        return useFeatureFlagConfiguration(
                            ff,
                            changed => {
                                onFeatureFlagsChanged(
                                    projectFeatureFlags.map(existing => {
                                        if (existing.id === changed.id) {
                                            return changed;
                                        }
                                        return existing;
                                    }),
                                );
                            },
                            pff,
                        );
                    },
                }}
                elevation={0}
            />
        </Box>
    );
};
