import React, { FunctionComponent } from 'react';
import { LinksFilter } from './LinksFilter';
import { LinksTableWithDownloads } from '../../../links/components/LinksTableWithDownloads';
import { DropdownOptions } from '../../../../types/utils';

type Props = {
    baseUrl: string;
    params: Record<string, string>;
    paramsPrefix: string;
    sources: DropdownOptions<number>[];
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
