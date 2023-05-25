/* eslint-disable react/no-array-index-key */
import React, { ReactElement, useMemo } from 'react';
import { useSafeIntl, IconButton } from 'bluesquare-components';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import MergeIcon from '@mui/icons-material/Merge';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { Box } from '@material-ui/core';
import { Column } from '../../../../types/table';
import { StarsComponent } from '../../../../components/stars/StarsComponent';
import { DuplicateCell } from './DuplicateCell';
import { formatLabel } from '../../../instances/utils';
import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../messages';

export const useDuplicationTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
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
                            <StarsComponent
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
                accessor: 'form.name',
                resizable: false,
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.comparedFields),
                accessor: 'the_fields',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { the_fields } = settings.row.original;
                    return (
                        <>
                            {the_fields.map((field, index) => (
                                <p key={`${field.field}- ${index}`}>
                                    {formatLabel(field)}
                                </p>
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
                    return (
                        <DuplicateCell settings={settings} entity="entity1" />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.entityB),
                accessor: 'entity2',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    return (
                        <DuplicateCell settings={settings} entity="entity2" />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: (settings): ReactElement => {
                    const { entity1, entity2, ignored, merged } =
                        settings.row.original;
                    let retVal = (
                        <>
                            <IconButton
                                url={`/${baseUrls.entityDuplicateDetails}/entities/${entity1.id},${entity2.id}`}
                                overrideIcon={CompareArrowsIcon}
                                tooltipMessage={MESSAGES.seeDetails}
                            />
                        </>
                    );

                    if (ignored) {
                        retVal = (
                            <>
                                <IconButton
                                    color="disabled"
                                    overrideIcon={RemoveCircleOutlineIcon}
                                    tooltipMessage={MESSAGES.alreadyIgnored}
                                />
                            </>
                        );
                    } else if (merged) {
                        retVal = (
                            <>
                                <IconButton
                                    color="disabled"
                                    overrideIcon={MergeIcon}
                                    tooltipMessage={MESSAGES.alreadyMerged}
                                />
                            </>
                        );
                    }

                    return retVal;
                },
            },
        ];
        return columns;
    }, [formatMessage]);
};
