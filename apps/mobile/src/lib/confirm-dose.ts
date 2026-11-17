import { Alert } from 'react-native';

/** Asks before writing a dose — it's a medical-record entry with no undo. */
export function confirmDose(t: (k: string) => string, onConfirm: () => void) {
  Alert.alert(t('ui.confirmDoseTitle'), t('ui.confirmDoseBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('ui.logIt'), onPress: onConfirm },
  ]);
}
