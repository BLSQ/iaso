import React, { ReactElement, useMemo } from 'react';
import { useSafeIntl, IconButton } from 'bluesquare-components';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import { Box, makeStyles, useTheme } from '@material-ui/core';
import MESSAGES from '../messages';
import { baseUrls } from '../../../../constants/urls';
import { convertValueIfDate } from '../../../../components/Cells/DateTimeCell';
import { DuplicatesStars } from '../DuplicatesStars';
import { Column } from '../../../../types/table';

const getFields = settings => {
    const { algorithms } = settings.row.original;
    const allFields = algorithms.map(algo => algo.fields).flat();
    return [...new Set(allFields)];
};

const useStyles = makeStyles(theme => {
    return {
        diff: { color: theme.palette.error.main },
    };
});

export const useDuplicationTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const theme = useTheme();
    return useMemo(() => {
        const columns = [
            {
                Header: formatMessage(MESSAGES.similarityScore),
                accessor: 'similarity_star',
                resizable: false,
                sortable: true,
                Cell: settings => {
                    return (
                        <Box display="flex" justifyContent="center">
                            <DuplicatesStars
                                starCount={5}
                                fullStars={
                                    settings.row.original.similarity_star
                                }
                            />
                        </Box>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.form),
                accessor: 'entity1.form.name',
                resizable: false,
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.comparedFields),
                accessor: 'algorithms',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const fields = getFields(settings);
                    return (
                        <>
                            {fields.map((field, index) => (
                                <p key={`${field}- ${index}`}>{field}</p>
                            ))}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.entityA),
                accessor: 'entity1',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { entity1, entity2 } = settings.row.original;
                    const fields = getFields(settings);
                    const entityFields = fields.map(
                        (field: string) => entity1.json[field],
                    );
                    const duplicateField = fields.map(
                        (field: string) => entity2.json[field],
                    );
                    return (
                        <>
                            {entityFields.map((field, index) => {
                                const duplicate = duplicateField[index];
                                const className =
                                    field !== duplicate ? classes.diff : '';
                                return (
                                    <p
                                        className={className}
                                        key={`entity1-${field}-${index}`}
                                    >
                                        {convertValueIfDate(field)}
                                    </p>
                                );
                            })}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.entityB),
                accessor: 'entity2',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { entity1, entity2 } = settings.row.original;
                    const fields = getFields(settings);
                    const entityFields = fields.map(
                        (field: string) => entity2.json[field],
                    );
                    const duplicateField = fields.map(
                        (field: string) => entity1.json[field],
                    );
                    return (
                        <>
                            {entityFields.map((field, index) => {
                                const duplicate = duplicateField[index];
                                const className =
                                    field !== duplicate ? classes.diff : '';
                                return (
                                    <p
                                        className={className}
                                        key={`entity2-${field}-${index}`}
                                    >
                                        {convertValueIfDate(field)}
                                    </p>
                                );
                            })}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: (settings): ReactElement => (
                    <>
                        <IconButton
                            url={`/${baseUrls.entity}/entityIds/${settings.row.original.entity1.id}/${settings.row.original.entity2.id}`}
                            overrideIcon={CompareArrowsIcon}
                            tooltipMessage={MESSAGES.seeDetails}
                        />
                    </>
                ),
            },
        ];
        return columns;
        // @ts-ignore
    }, [classes.diff, formatMessage, theme.palette.ligthGray.main]);
};
