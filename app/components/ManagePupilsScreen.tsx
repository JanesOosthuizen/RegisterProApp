import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Modal, StyleSheet, Keyboard, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiClient from "./apiClient";
import theme from "../themes/default";

// Define the types for a pupil and class object
type SchoolClass = {
  id: number;
  name: string;
};

type Pupil = {
  id: number;
  name: string;
  class_id: number;
};

const PUPIL_API_URL = '/pupils'; // Replace with your Laravel API endpoint for pupils
const CLASS_API_URL = '/classes'; // Replace with your Laravel API endpoint for classes

export const ManagePupilsScreen: React.FC = () => {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedPupil, setSelectedPupil] = useState<Pupil | null>(null);
  const [pupilName, setPupilName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch all pupils
  const fetchPupils = async () => {
    try {
      const response = await apiClient.get(PUPIL_API_URL);
      setPupils(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pupils.');
    }
  };

  // Fetch all classes
  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(CLASS_API_URL);
      setClasses(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch classes.');
    }
  };

  // Create a new pupil
  const createPupil = async () => {
    if (!pupilName || !selectedClassId) {
      Alert.alert('Validation Error', 'Pupil name and class are required.');
      return;
    }
    try {
      await apiClient.post(PUPIL_API_URL, { name: pupilName, class_id: selectedClassId });
      Alert.alert('Success', 'Pupil created successfully.');
      setPupilName('');
      setSelectedClassId(null);
      Keyboard.dismiss();
      setIsModalVisible(false);
      fetchPupils();
    } catch (error) {
      Alert.alert('Error', 'Failed to create pupil.');
    }
  };

  // Update an existing pupil
  const updatePupil = async () => {
    if (!pupilName || !selectedClassId || !selectedPupil) {
      Alert.alert('Validation Error', 'Pupil name and class are required.');
      return;
    }
    try {
      await apiClient.put(`${PUPIL_API_URL}/${selectedPupil.id}`, { name: pupilName, class_id: selectedClassId });
      Alert.alert('Success', 'Pupil updated successfully.');
      setPupilName('');
      setSelectedClassId(null);
      setIsEditing(false);
      setSelectedPupil(null);
      Keyboard.dismiss();
      setIsModalVisible(false);
      fetchPupils();
    } catch (error) {
      Alert.alert('Error', 'Failed to update pupil.');
    }
  };

  // Delete a pupil
  const deletePupil = async (id: number) => {
    try {
      await apiClient.delete(`${PUPIL_API_URL}/${id}`);
      Alert.alert('Success', 'Pupil deleted successfully.');
      fetchPupils();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete pupil.');
    }
  };

  // Handle Edit Button Click
  const handleEdit = (pupil: Pupil) => {
    setSelectedPupil(pupil);
    setPupilName(pupil.name);
    setSelectedClassId(pupil.class_id);
    setIsEditing(true);
    setIsModalVisible(true);
  };

  // Open modal for creating pupil
  const openCreatePupilModal = () => {
    setPupilName('');
    setIsEditing(false);
    setIsModalVisible(true);
  };

  useEffect(() => {
    fetchClasses();
    fetchPupils();
  }, []);

  return (
    <View style={styles.container}>
	  <View style={styles.pageHeader}>
	  	<Text style={styles.pageTitle}>Manage Pupils</Text>
		  <TouchableOpacity style={styles.addButton} onPress={openCreatePupilModal}>
				<Text style={styles.buttonText}>Add Pupil</Text>
			</TouchableOpacity>
	  </View>
      <FlatList
        data={pupils}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.pupilItem}>
            <Text style={styles.pupilText}>
              {item.name} - {classes.find((cls) => cls.id === item.class_id)?.name || 'No Class Assigned'}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deletePupil(item.id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal for Create/Edit Pupil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Pupil' : 'Add Pupil'}</Text>
            <TextInput
              placeholder="Pupil Name (Required)"
              value={pupilName}
              onChangeText={setPupilName}
              style={styles.input}
            />
            <Picker
              selectedValue={selectedClassId || undefined}
              onValueChange={(itemValue: number | undefined) => setSelectedClassId(itemValue || null)}
              style={styles.input}
            >
              <Picker.Item label="Select a Class" value={undefined} />
              {classes.map((cls) => (
                <Picker.Item key={cls.id} label={cls.name} value={cls.id} />
              ))}
            </Picker>
            <TouchableOpacity
              style={[styles.button, isEditing ? styles.editButton : styles.createButton]}
              onPress={isEditing ? updatePupil : createPupil}
            >
              <Text style={styles.buttonText}>{isEditing ? 'Update Pupil' : 'Create Pupil'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  pupilItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#ffffff',
    width: '100%',
  },
  pupilText: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 100,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
	paddingVertical: 5,
    paddingHorizontal: 10,
	borderRadius: 5,
	marginRight: 5,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
	paddingVertical: 5,
    paddingHorizontal: 10,
	borderRadius: 5,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  pageHeader: {
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "space-between",
	paddingHorizontal: 10, // Ensure padding on both sides
	width: "100%", // Ensure it stays within the screen
	marginBottom: 20,
  },
  pageTitle: {
	fontSize: 24,
	fontWeight: "bold",
	color: theme.colors.textLight,
  },
});

export default ManagePupilsScreen;
