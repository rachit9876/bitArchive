import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, View } from 'react-native';
import { Text } from 'react-native-paper';
import styles from '../styles';

const GalleryScreen = ({ images, refreshing, onRefresh, onOpen }) => {
  return (
    <FlatList
      data={images}
      keyExtractor={item => item.name}
      numColumns={3}
      contentContainerStyle={styles.grid}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Pressable style={styles.gridItem} onPress={() => onOpen(item)}>
          <Image source={{ uri: item.url }} style={styles.gridImage} />
        </Pressable>
      )}
      ListEmptyComponent={
        refreshing ? (
          <View style={styles.grid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`grid-skeleton-${index}`} style={[styles.gridItem, styles.skeleton]} />
            ))}
          </View>
        ) : (
          <Text style={styles.hint}>No images found.</Text>
        )
      }
    />
  );
};

export default GalleryScreen;
