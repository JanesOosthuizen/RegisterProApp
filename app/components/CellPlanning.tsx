import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { useEffect } from "react";
import apiClient from "./apiClient";

type PlanningItem = {
	id?: number;
	className: string;
	subject: string;
	pupils: string;
	content: string;
  };

const CellPlanning: React.FC<{ cellKey: string; onClose: () => void }> = ({ cellKey, onClose }) => {
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  
  const [newPlanning, setNewPlanning] = useState({
    className: "",
    subject: "",
    pupils: "",
    content: "",
  });

  const fetchPlanningItems = async () => {
	console.log('fetching planning items');
    try {
      const response = await apiClient.get(`/planning/`);
	  console.log(response.data);
      setPlanningItems(response.data);
    } catch (error) {
      console.error("Error fetching planning items:", error);
    }
  };

  const savePlanningItem = async () => {
    try {
      const response = await apiClient.post(`/cell-planning/${cellKey}`, newPlanning);
      setPlanningItems((prev) => [...prev, response.data]);
      setNewPlanning({ className: "", subject: "", pupils: "", content: "" });
    } catch (error) {
      console.error("Error saving planning item:", error);
    }
  };

  useEffect(() => {
    fetchPlanningItems();
  }, []);

  return (
    <View style={styles.modal}>
      <Text style={styles.modalTitle}>Planning Items for Cell {cellKey}</Text>
      <ScrollView>
        {planningItems.map((item, index) => (
          <View key={index} style={styles.planningItem}>
            <Text style={styles.label}>Class:</Text>
            <Text>{item.className}</Text>
            <Text style={styles.label}>Subject:</Text>
            <Text>{item.subject}</Text>
            <Text style={styles.label}>Pupils:</Text>
            <Text>{item.pupils}</Text>
            <Text style={styles.label}>Content:</Text>
            <Text>{item.content}</Text>
          </View>
        ))}

        <Text style={styles.modalTitle}>New Planning Item</Text>
        <TextInput
          style={styles.input}
          placeholder="Class Name"
          value={newPlanning.className}
          onChangeText={(text) => setNewPlanning((prev) => ({ ...prev, className: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Subject"
          value={newPlanning.subject}
          onChangeText={(text) => setNewPlanning((prev) => ({ ...prev, subject: text }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Pupils"
          value={newPlanning.pupils}
          onChangeText={(text) => setNewPlanning((prev) => ({ ...prev, pupils: text }))}
        />
        <TextInput
          style={[styles.input, styles.largeInput]}
          placeholder="Enter detailed content..."
          value={newPlanning.content}
          onChangeText={(text) => setNewPlanning((prev) => ({ ...prev, content: text }))}
          multiline
        />
        <TouchableOpacity style={styles.saveButton} onPress={savePlanningItem}>
          <Text style={styles.saveButtonText}>Save Planning Item</Text>
        </TouchableOpacity>
      </ScrollView>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CellPlanning;

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  planningItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
  },
  label: {
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  largeInput: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 20,
    alignSelf: "center",
  },
  closeText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
  },
});
