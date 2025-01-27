import React, { useState, useEffect } from "react";
import * as Updates from "expo-updates";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";

export const SettingsScreen: React.FC = () => {

  const checkForUpdates = async () => {
	try {
		const update = await Updates.checkForUpdateAsync();
		if (update.isAvailable) {
		Alert.alert(
			"Update Available",
			"A new update is available. The app will now update.",
			[
			{
				text: "OK",
				onPress: async () => {
				await Updates.fetchUpdateAsync();
				await Updates.reloadAsync(); // Reload the app with the new update
				},
			},
			]
		);
		} else {
		Alert.alert("No Updates", "The app is up to date.");
		}
	} catch (error) {
		console.error("Error checking for updates:", error);
		Alert.alert("Error", "Failed to check for updates.");
	}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
	  <TouchableOpacity style={styles.updateButton} onPress={checkForUpdates}>
        <Text style={styles.updateButtonText}>Check for Updates</Text>
      </TouchableOpacity>
    </View>
  );
}

export default SettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  updateButton: {
    backgroundColor: "#3498db",
    padding: 10,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});