import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type Props = {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    selected: boolean;
    onPress: () => void;
};

export function SelectableRow({ label, icon, selected, onPress }: Props) {
    return (
        <TouchableOpacity
            style={[styles.row, selected && styles.rowSelected]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            {icon && (
                <Ionicons name={icon} size={20} color={selected ? Colors.textHeadline : Colors.textMuted} />
            )}
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
            {selected && (
                <View style={styles.checkBadge}>
                    <MaterialIcons name="check" size={13} color="white" />
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.borderCard,
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 15,
    },
    rowSelected: {
        borderColor: Colors.textHeadline,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    label: {
        flex: 1,
        fontFamily: Fonts.sansSemiBold,
        fontSize: 15,
        color: Colors.textMuted,
    },
    labelSelected: {
        color: Colors.textHeadline,
    },
    checkBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.textHeadline,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
