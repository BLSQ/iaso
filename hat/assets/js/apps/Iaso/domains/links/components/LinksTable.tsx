import React, { FunctionComponent } from 'react';
import { Column } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { useLinksTableColumns } from '../config';
import { useValidateLink } from '../hooks/useValidateLink';
import LinksDetails from './LinksDetailsComponent';

type Props = {
    baseUrl: string;
    params: Record<string, any>;
    defaultPageSize?: number;
    paramsPrefix?: string;
    data?: any;
    loading: boolean;
    expanded?: Record<string, any>;
    // eslint-disable-next-line no-unused-vars
    setExpanded: (value: React.SetStateAction<Record<any, any>>) => void;
};

export const LinksTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    defaultPageSize = 10,
    paramsPrefix,
    data,
    loading,
    expanded,
    setExpanded,
}) => {
    const { mutateAsync: validateLink } = useValidateLink();
    const columns = useLinksTableColumns(validateLink) as Column[];

    return (
        <TableWithDeepLink
            baseUrl={baseUrl}
            params={params}
            paramsPrefix={paramsPrefix}
            defaultSorted={[{ id: 'similarity_score', desc: true }]}
            columns={columns}
            data={data?.links ?? []}
            count={data?.count ?? 0}
            pages={data?.pages ?? 0}
            extraProps={{
                defaultPageSize: data?.limit ?? defaultPageSize,
                loading,
                expanded,
                onExpandedChange: newExpanded => setExpanded(newExpanded),
                SubComponent: link =>
                    link ? (
                        <LinksDetails
                            // @ts-ignore
                            linkId={link.id}
                            validated={link.validated}
                            validateLink={() => validateLink(link)}
                        />
                    ) : null,
            }}
        />
    );
};
