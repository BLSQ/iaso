import React, { useMemo } from 'react';
import { ProductFruits } from 'react-product-fruits';
import { useCurrentAccount } from 'Iaso/domains/accounts/hooks';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

const ProductFruitsComponent = () => {
    const currentUser = useCurrentUser();
    const currentAccount = useCurrentAccount();

    const userInfo = useMemo(() => {
        if (!currentUser || !currentAccount) {
            return null;
        }
        return {
            username: `${currentAccount.name}-${currentUser.id}`,
            props: {
                account_name: currentAccount.name,
                account_id: currentAccount.id,
            },
        };
    }, [currentUser, currentAccount]);

    if (!window.PRODUCT_FRUITS_WORKSPACE_CODE || !currentUser || !userInfo) {
        return null;
    }

    return (
        <ProductFruits
            workspaceCode={window.PRODUCT_FRUITS_WORKSPACE_CODE}
            language={currentUser.language || 'en'}
            user={userInfo}
        />
    );
};

export default ProductFruitsComponent;
