import React, { FC, Key, ReactNode } from 'react';
import {
    Box,
    Breadcrumbs as MuiBreadcrumbs,
    Link,
    SxProps,
    Theme,
    Typography,
} from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { LinkTo } from './LinkTo';

export type BreadcrumbItem = {
    key: Key;
    label: string;
    url?: string;
    onClick?: () => void;
};

const styles = {
    urlLink: {
        '& a': { color: 'mediumGray.main' },
    },
    buttonLink: {
        color: 'mediumGray.main',
        font: 'inherit',
        verticalAlign: 'baseline',
    },
} satisfies SxStyles;

type ItemProps = {
    item: BreadcrumbItem;
    isCurrent: boolean;
    replace: boolean;
};

const BreadcrumbItemContent: FC<ItemProps> = ({ item, isCurrent, replace }) => {
    if (isCurrent) {
        return (
            <Typography component="span" color="primary" fontSize="inherit">
                {item.label}
            </Typography>
        );
    }
    if (item.url) {
        return (
            <Box component="span" sx={styles.urlLink}>
                <LinkTo
                    condition
                    url={item.url}
                    text={item.label}
                    replace={replace}
                />
            </Box>
        );
    }
    if (item.onClick) {
        return (
            <Link
                component="button"
                underline="hover"
                onClick={item.onClick}
                sx={styles.buttonLink}
            >
                {item.label}
            </Link>
        );
    }
    return <>{item.label}</>;
};

type Props = {
    items: BreadcrumbItem[];
    showCurrent?: boolean;
    separator?: ReactNode;
    replace?: boolean;
    sx?: SxProps<Theme>;
};

/**
 * With `showCurrent`, the last item is the current page and is not clickable.
 * Other items navigate to `url`, run `onClick`, or are plain text when they have neither.
 */
export const Breadcrumbs: FC<Props> = ({
    items,
    showCurrent = true,
    separator = '>',
    replace = true,
    sx,
}) => (
    <MuiBreadcrumbs separator={separator} sx={sx}>
        {items.map((item, index) => (
            <BreadcrumbItemContent
                key={item.key}
                item={item}
                isCurrent={showCurrent && index === items.length - 1}
                replace={replace}
            />
        ))}
    </MuiBreadcrumbs>
);
