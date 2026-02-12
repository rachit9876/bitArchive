import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ImageIcon } from '../components/Icons';
import styles from '../styles';

const GalleryScreen = ({ images, refreshing, onRefresh, onOpen }) => {
  const theme = useTheme();

  return (
    <FlatList
      data={images}
      keyExtractor={item => item.name}
      numColumns={3}
      contentContainerStyle={styles.grid}
      contentContainerStyleGrow={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Pressable
          style={styles.gridItem}
          onPress={() => onOpen(item)}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
        >
          <Image source={{ uri: item.url }} style={styles.gridImage} />
        </Pressable>
      )}
      ListEmptyComponent={
        refreshing ? (
          <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {Array.from({ length: 9 }).map((_, index) => (
              <View key={`grid-skeleton-${index}`} style={[styles.gridItem, styles.skeleton]} />
            ))}
          </View>
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
