import React, { FunctionComponent, useState } from 'react';
import { Column } from 'bluesquare-components';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { useLinksTableColumns } from '../config';
import { useValidateLink } from '../hooks/useValidateLink';
import { useGetLinks } from '../hooks/useGetLinks';
import LinksDetails from './LinksDetailsComponent';
import { usePrefixedParams } from '../../../routing/hooks/usePrefixedParams';

type Props = {
    baseUrl: string;
    params: Record<string, any>;
    defaultPageSize?: number;
    paramsPrefix?: string;
};

export const LinksTable: FunctionComponent<Props> = ({
    baseUrl,
    params,
    defaultPageSize = 10,
    paramsPrefix,
}) => {
    const [expanded, setExpanded] = useState({});
    const onSuccess = () => {
        setExpanded({});
    };
    const apiParams = usePrefixedParams(paramsPrefix, params);

    // The orgUnitId is passed only in orgUnit details, so it can be used to trigger the API call
    const enabled =
        Boolean(apiParams?.searchActive) || Boolean(apiParams?.orgUnitId);
    const { data, isLoading: loading } = useGetLinks({
        params: apiParams,
        onSuccess,
        enabled,
    });
    const { mutateAsync: validateLink } = useValidateLink();
    const columns = useLinksTableColumns(validateLink) as Column[];
    if (!enabled) {
        return null;
    }
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
