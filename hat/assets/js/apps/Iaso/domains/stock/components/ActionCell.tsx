import React, { FunctionComponent } from 'react';
import { IconButton } from 'bluesquare-components';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import Workflow from 'Iaso/components/svg/Workflow';
import { baseUrls } from 'Iaso/constants/urls';
import { EditSkuDialog } from 'Iaso/domains/stock/components/SkuDialog';
import useGetPublishedStockRulesVersion, {
    useDeleteSKU,
    useSaveSku,
} from 'Iaso/domains/stock/hooks/requests';
import MESSAGES from 'Iaso/domains/stock/messages';
import { StockKeepingUnit } from 'Iaso/domains/stock/types/stocks';

type Props = {
    sku: StockKeepingUnit;
};

export const SkusActionCell: FunctionComponent<Props> = ({ sku }) => {
    const { data: publishedVersion } = useGetPublishedStockRulesVersion();
    const { mutate: deleteSku } = useDeleteSKU();
    const { mutate: saveSku } = useSaveSku();
    return (
        <>
            <EditSkuDialog
                initialData={{
                    ...sku,
                    org_unit_types: sku.org_unit_types?.map(type => type.id),
                    projects: sku.projects?.map(project => project.id),
                    forms: sku.forms?.map(form => form.id),
                    children: sku.children?.map(children => children.id),
                }}
                iconProps={{}}
                titleMessage={MESSAGES.updateMessage}
                saveSku={saveSku}
            />
            <DeleteDialog
                keyName={`delete-sku-${sku.id}`}
                titleMessage={MESSAGES.deleteSkuTitle}
                message={MESSAGES.deleteText}
                onConfirm={() => deleteSku(sku)}
            />
            {publishedVersion != null && (
                <IconButton
                    id={`rules-link-${sku.id}`}
                    url={`/${baseUrls.stockRulesVersions}/versionId/${publishedVersion.id}/skuId/${sku.id}/`}
                    tooltipMessage={MESSAGES.rules}
                    overrideIcon={Workflow}
                />
            )}
        </>
    );
};
