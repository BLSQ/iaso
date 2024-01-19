import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import { Grid, Box } from '@mui/material';
import { getFileName } from '../../utils/filesUtils';
import VideoItem from './VideoItemComponent';
import { ShortFile } from '../../domains/instances/types/instance';

const styles = {
    root: {
        marginTop: theme => theme.spacing(2),
        marginBottom: theme => theme.spacing(2),
    },
};

type Props = {
    videoList: ShortFile[];
};

const VideosListComponent: FunctionComponent<Props> = ({ videoList }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number | undefined>(undefined);
    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
    }, []);
    return (
        <Box ref={containerRef}>
            {width && (
                <Grid container spacing={2} sx={styles.root}>
                    {videoList.map(file => (
                        <Grid
                            item
                            xs={width < 500 ? 12 : 6}
                            key={`${file.itemId}-${
                                getFileName(file.path).name
                            }`}
                        >
                            <VideoItem videoItem={file} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default VideosListComponent;
