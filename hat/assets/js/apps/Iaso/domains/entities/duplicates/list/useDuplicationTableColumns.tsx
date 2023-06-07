/* eslint-disable react/no-array-index-key */
import React, { ReactElement, useMemo } from 'react';
import { useSafeIntl, IconButton, Column } from 'bluesquare-components';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import { Box } from '@material-ui/core';
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
                accessor: 'fields',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    const { fields } = settings.row.original;
                    return (
                        <>
                            {fields.map((field, index) => (
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
                Cell: (settings): ReactElement => (
                    <>
                        <IconButton
                            url={`/${baseUrls.entityDuplicateDetails}/entities/${settings.row.original.entity1.id},${settings.row.original.entity2.id}`}
                            overrideIcon={CompareArrowsIcon}
                            tooltipMessage={MESSAGES.seeDetails}
                        />
                    </>
                ),
            },
        ];
        return columns;
    }, [formatMessage]);
};
