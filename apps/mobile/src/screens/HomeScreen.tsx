import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../auth';
import { colors } from '../ui';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hi}>Hi, {user?.fullName} 👋</Text>
      <Text style={styles.muted}>You're all set up.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Semetra course</Text>
        <Text style={styles.item}>
          Open the <Text style={{ fontWeight: '700' }}>Semetra</Text> tab below to start your
          titration and tick off each weekly dose.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming next</Text>
        <Text style={styles.item}>• Offline dose reminders</Text>
        <Text style={styles.item}>• Weight tracking + trend chart</Text>
      </View>

      <TouchableOpacity onPress={logout} style={{ marginTop: 24 }}>
        <Text style={styles.link}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, flexGrow: 1 },
  hi: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14 },
  cardTitle: { fontWeight: '600', color: colors.text, marginBottom: 10 },
  item: { color: colors.muted, marginBottom: 6 },
  link: { color: colors.petra, fontWeight: '600', textAlign: 'center' },
});
