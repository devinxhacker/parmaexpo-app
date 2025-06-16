import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  useColorScheme as useRNColorScheme,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from './ThemedText';

interface PickerItem {
  label: string;
  value: any;
}

interface CustomPickerProps {
  items: PickerItem[];
  onValueChange: (value: any) => void;
  value?: any;
  placeholder?: { label: string; value: any } | string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  modalTitle?: string;
  disabled?: boolean;
}

export const CustomPicker: React.FC<CustomPickerProps> = ({
  items,
  onValueChange,
  value,
  placeholder,
  style,
  textStyle,
  modalTitle = "Select an item",
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useRNColorScheme() ?? 'light';

  const selectedItem = items.find(item => item.value === value);
  const displayLabel = selectedItem?.label || (typeof placeholder === 'string' ? placeholder : placeholder?.label) || "Select...";

  const pickerStyles = StyleSheet.create({
    touchable: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border || Colors[colorScheme].gray,
      borderRadius: 5,
      backgroundColor: Colors[colorScheme].card || Colors[colorScheme].background,
      minHeight: 42, // Approximate height of a standard input
      justifyContent: 'center',
    },
    touchableText: {
      fontSize: 16,
      color: (value !== undefined && value !== null && selectedItem) ? Colors[colorScheme].text : Colors[colorScheme].gray,
    },
    disabledTouchable: {
      backgroundColor: Colors[colorScheme].disabledBackground || '#f0f0f0',
    },
    disabledText: {
      color: Colors[colorScheme].disabledText || Colors[colorScheme].gray,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: Colors[colorScheme].card || Colors[colorScheme].background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 10,
      maxHeight: '70%',
    },
    modalHeader: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors[colorScheme].border || Colors[colorScheme].gray,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitleText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    closeButtonText: {
      fontSize: 16,
      color: Colors[colorScheme].tint,
    },
    itemContainer: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors[colorScheme].border || Colors[colorScheme].gray,
    },
    itemText: {
      fontSize: 16,
    },
    selectedItemText: {
      fontWeight: 'bold',
      color: Colors[colorScheme].tint,
    },
    listContent: {
      paddingBottom: 20,
    }
  });

  const itemsForFlatList = useMemo(() => {
    if (typeof placeholder === 'object' && placeholder.label && placeholder.value !== undefined) {
      const placeholderExists = items.some(item => item.value === placeholder.value && item.label === placeholder.label);
      if (!placeholderExists) {
        return [{ label: placeholder.label, value: placeholder.value }, ...items];
      }
    }
    return items;
  }, [items, placeholder]);

  const handleSelect = (itemValue: any) => {
    onValueChange(itemValue);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[pickerStyles.touchable, style, disabled && pickerStyles.disabledTouchable]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[pickerStyles.touchableText, textStyle, disabled && pickerStyles.disabledText]}>
          {displayLabel}
        </Text>
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={pickerStyles.modalOverlay} onTouchEnd={() => setModalVisible(false)}>
          <View style={pickerStyles.modalContent} onTouchEnd={(e) => e.stopPropagation()}>
            <View style={pickerStyles.modalHeader}>
              <ThemedText type="subtitle" style={pickerStyles.modalTitleText}>{modalTitle}</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <ThemedText style={pickerStyles.closeButtonText}>Done</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList data={itemsForFlatList} keyExtractor={(item, index) => String(item.value) + index} renderItem={({ item }) => (
              <TouchableOpacity style={pickerStyles.itemContainer} onPress={() => handleSelect(item.value)}>
                <ThemedText style={[pickerStyles.itemText, item.value === value && pickerStyles.selectedItemText]}>{item.label}</ThemedText>
              </TouchableOpacity>
            )} contentContainerStyle={pickerStyles.listContent} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

// Ensure your Colors constant has these (or similar) for best results:
// Colors.light.border, Colors.dark.border (fallback: gray)
// Colors.light.card, Colors.dark.card (fallback: background)
// Colors.light.disabledBackground, Colors.dark.disabledBackground (fallback: a light gray or #f0f0f0)
// Colors.light.disabledText, Colors.dark.disabledText (fallback: gray)
