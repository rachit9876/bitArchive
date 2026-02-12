import React, { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ImageIcon } from '../components/Icons';
import styles from '../styles';

const BLUR_IMAGE = require('../../assets/blur.jpeg');

const GridItem = memo(function GridItem({ item, onOpen, shouldBlur }) {
  const source = shouldBlur ? BLUR_IMAGE : { uri: item.url };
  return (
    <Pressable
      style={styles.gridItem}
      onPress={() => onOpen(item)}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
    >
      <Image source={source} style={styles.gridImage} />
    </Pressable>
  );
});


const EmptySkeleton = memo(function EmptySkeleton() {
  return (
    <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}> 
      {Array.from({ length: 9 }).map((_, index) => (
        <View key={`grid-skeleton-${index}`} style={[styles.gridItem, styles.skeleton]} />
      ))}
    </View>
  );
});

const GalleryScreen = ({ images, refreshing, onRefresh, onOpen, safetyBlur = true }) => {
  const theme = useTheme();
  const [revealed, setRevealed] = useState({});

  const revealedSet = useMemo(() => revealed, [revealed]);

  const handleOpen = useCallback(
    item => {
      setRevealed(prev => ({ ...prev, [item.name]: true }));
      onOpen(item);
    },
    [onOpen]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <GridItem
        item={item}
        onOpen={handleOpen}
        shouldBlur={Boolean(safetyBlur) && !revealedSet[item.name]}
      />
    ),
    [handleOpen, revealedSet, safetyBlur]
  );

  return (
    <FlatList
      data={images}
      keyExtractor={item => item.name}
      numColumns={3}
      contentContainerStyle={[styles.grid, images.length === 0 ? { flexGrow: 1 } : null]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={renderItem}
      initialNumToRender={18}
      maxToRenderPerBatch={12}
      windowSize={9}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
      ListEmptyComponent={
        refreshing ? (
          <EmptySkeleton />
        ) : (
          <View style={styles.emptyState}>
            <ImageIcon size={48} color={theme.colors.onSurface + '55'} />
            <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
              No images yet
            </Text>
            <Text style={[styles.emptyHint, { color: theme.colors.onSurface }]}>
              Upload your first image using the Upload tab, or pull down to refresh from GitHub.
            </Text>
          </View>
        )
      }
    />
  );
};

export default GalleryScreen;
