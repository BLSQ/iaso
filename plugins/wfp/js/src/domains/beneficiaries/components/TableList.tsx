import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useMemo,
    useState,
} from 'react';
import BugReportIcon from '@mui/icons-material/BugReport';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Column, Expander, useSafeIntl } from 'bluesquare-components';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls as coreBaseUrls } from 'Iaso/constants/urls';
import { PaginatedResponse } from 'Iaso/domains/app/types';
import { baseUrls } from '../../../constants/urls';
import { BeneficiaryDataDialog } from './Fragments';
import { Journeys } from './Journeys';
import MESSAGES from './../messages';
import { Params, Beneficiary } from './../types';

export const DEFAULT_PAGE_SIZE = 20;
const defaultSorted = [{ id: 'last_visit_date', desc: true }];

type ActionsProps = {
    // given by the table to the expander of each row
    row: { original: Beneficiary };
    isExpanded: boolean;
    setIsExpanded: Dispatch<SetStateAction<boolean>>;
    accountId?: string;
    onShowData: (entityId: number) => void;
};

// The expander column: the links of the beneficiary, then the eye that expands the row (its journeys)
const Actions: FunctionComponent<ActionsProps> = ({
    row,
    isExpanded,
    setIsExpanded,
    accountId,
    onShowData,
}) => {
    const { formatMessage } = useSafeIntl();
    const beneficiary = row.original;
    return (
        <Box display="flex" justifyContent="center" alignItems="center">
            <Tooltip title={formatMessage(MESSAGES.beneficiaryData)}>
                <IconButton
                    size="small"
                    aria-label={formatMessage(MESSAGES.beneficiaryData)}
                    onClick={() => onShowData(beneficiary.entity_id)}
                >
                    <PersonIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title={formatMessage(MESSAGES.debug)}>
                <IconButton
                    size="small"
                    aria-label={formatMessage(MESSAGES.debug)}
                    href={`/wfp/debug/${beneficiary.entity_id}/`}
                    target="_blank"
                >
                    <BugReportIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title={formatMessage(MESSAGES.seeEntity)}>
                <IconButton
                    size="small"
                    aria-label={formatMessage(MESSAGES.seeEntity)}
                    href={`/dashboard/${coreBaseUrls.entityDetails}/accountId/${accountId}/entityId/${beneficiary.entity_id}`}
                    target="_blank"
                >
                    <OpenInNewIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Expander isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        </Box>
    );
};

const JourneysSubComponent = (beneficiary?: Beneficiary) =>
    beneficiary ? (
        <Box
            sx={theme => ({
                p: 2,
                background: alpha(theme.palette.primary.main, 0.04),
                textAlign: 'left',
            })}
        >
            <Journeys beneficiary={beneficiary} />
        </Box>
    ) : null;

const useColumns = (
    accountId: string | undefined,
    onShowData: (entityId: number) => void,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.entityId),
                id: 'entity_id',
                accessor: 'entity_id',
            },
            {
                Header: formatMessage(MESSAGES.uuid),
                id: 'uuid',
                accessor: 'uuid',
                sortable: false,
                Cell: ({ value }) => (
                    <Box
                        component="span"
                        title={value}
                        sx={{
                            display: 'inline-block',
                            maxWidth: 140,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            verticalAlign: 'middle',
                        }}
                    >
                        {value}
                    </Box>
                ),
            },
            {
                Header: formatMessage(MESSAGES.entityType),
                id: 'entity_type_name',
                accessor: 'entity_type_name',
                sortable: false,
                Cell: ({ value }) => (
                    <Chip size="small" color="primary" label={value} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.gender),
                id: 'gender',
                accessor: 'gender',
                Cell: ({ value }) => value ?? '--',
            },
            {
                Header: formatMessage(MESSAGES.birthDate),
                id: 'birth_date',
                accessor: 'birth_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.journeys),
                id: 'journeys_count',
                accessor: 'journeys_count',
            },
            {
                Header: formatMessage(MESSAGES.visits),
                id: 'visits_count',
                accessor: 'visits_count',
            },
            {
                Header: formatMessage(MESSAGES.lastVisit),
                id: 'last_visit_date',
                accessor: 'last_visit_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'expander',
                accessor: 'expander',
                expander: true,
                width: 160,
                Expander: (
                    props: Omit<ActionsProps, 'accountId' | 'onShowData'>,
                ) => (
                    <Actions
                        {...props}
                        accountId={accountId}
                        onShowData={onShowData}
                    />
                ),
            },
        ],
        [formatMessage, accountId, onShowData],
    );
};

type Props = {
    data?: PaginatedResponse<Beneficiary>;
    loading: boolean;
    params: Params;
};

export const TableList: FunctionComponent<Props> = ({
    data,
    loading,
    params,
}) => {
    const [dataEntityId, setDataEntityId] = useState<number | undefined>();
    const columns = useColumns(params.accountId, setDataEntityId);
    return (
        <>
            <TableWithDeepLink
                baseUrl={baseUrls.wfpBeneficiaries}
                data={data?.results ?? []}
                pages={data?.pages ?? 1}
                count={data?.count ?? 0}
                defaultSorted={defaultSorted}
                columns={columns}
                params={params}
                noDataMessage={MESSAGES.noBeneficiaries}
                extraProps={{
                    loading,
                    defaultPageSize: DEFAULT_PAGE_SIZE,
                    SubComponent: JourneysSubComponent,
                }}
            />
            <BeneficiaryDataDialog
                entityId={dataEntityId}
                onClose={() => setDataEntityId(undefined)}
            />
        </>
    );
};
