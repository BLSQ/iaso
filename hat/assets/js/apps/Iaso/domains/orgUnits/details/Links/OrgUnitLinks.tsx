import React, { FunctionComponent } from 'react';
import { DataSource } from 'Iaso/domains/dataSources/types/dataSources';
import { LinksTableWithDownloads } from '../../../links/components/LinksTableWithDownloads';
import { LinksFilter } from './LinksFilter';

type Props = {
    baseUrl: string;
    params: Record<string, string>;
    paramsPrefix: string;
    sources: DataSource[];
    isLoadingSources: boolean;
};

export const OrgUnitLinks: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
    sources,
    isLoadingSources,
}) => {
    return (
        <LinksTableWithDownloads
            baseUrl={baseUrl}
            params={params}
            paramsPrefix={paramsPrefix}
        >
            <LinksFilter
                baseUrl={baseUrl}
                params={params}
                sources={sources}
                isLoadingSources={isLoadingSources}
            />
        </LinksTableWithDownloads>
    );
};
