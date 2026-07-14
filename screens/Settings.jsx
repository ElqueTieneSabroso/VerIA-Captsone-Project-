import React, { useState } from 'react';
import { View, Text, StyleSheet, SectionList, Switch, TouchableOpacity } from 'react-native';

const SettingsScreen = () => {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const sections = [
    {
      title: 'Cuenta',
      data: [
        { key: 'profile', title: 'Editar Perfil', subtitle: 'Actualiza tus datos' },
        { key: 'password', title: 'Cambiar Contraseña', subtitle: 'Seguridad' },
      ],
    },
    {
      title: 'Preferencias',
      data: [
        { 
          key: 'notifications', 
          title: 'Notificaciones', 
          type: 'switch', 
          value: isNotificationsEnabled, 
          onToggle: () => setIsNotificationsEnabled(!isNotificationsEnabled)
        },
        { 
          key: 'darkmode', 
          title: 'Modo Oscuro', 
          type: 'switch', 
          value: isDarkModeEnabled, 
          onToggle: () => setIsDarkModeEnabled(!isDarkModeEnabled)
        },
      ],
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.rowSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.type === 'switch' ? (
        <Switch value={item.value} onValueChange={item.onToggle} />
      ) : (
        <Text style={styles.arrow}>{'>'}</Text>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginLeft: 16, marginBottom: 8, color: '#666' },
  row: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16 },
  rowSubtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  arrow: { fontSize: 18, color: '#c7c7cc' },
});

export default SettingsScreen;
