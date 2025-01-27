import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert, Modal, StyleSheet, Keyboard, TouchableOpacity, ScrollView } from 'react-native';
import apiClient from "./apiClient";
import theme from "../themes/default";

// Define the type for a subject object
type Subject = {
  id: number;
  name: string;
};

const API_URL = '/subjects'; // Replace with your Laravel API endpoint

export const ManageSubjectsScreen: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch all subjects
  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get(API_URL);
      setSubjects(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch subjects.');
    }
  };

  // Create a new subject
  const createSubject = async () => {
    if (!subjectName) {
      Alert.alert('Validation Error', 'Subject name is required.');
      return;
    }
    try {
      await apiClient.post(API_URL, { name: subjectName });
      Alert.alert('Success', 'Subject created successfully.');
      setSubjectName('');
      Keyboard.dismiss();
      setIsModalVisible(false);
      fetchSubjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to create subject.');
    }
  };

  // Update an existing subject
  const updateSubject = async () => {
    if (!subjectName || !selectedSubject) {
      Alert.alert('Validation Error', 'Subject name is required.');
      return;
    }
    try {
      await apiClient.put(`${API_URL}/${selectedSubject.id}`, { name: subjectName });
      Alert.alert('Success', 'Subject updated successfully.');
      setSubjectName('');
      setIsEditing(false);
      setSelectedSubject(null);
      Keyboard.dismiss();
      setIsModalVisible(false);
      fetchSubjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to update subject.');
    }
  };

  // Delete a subject
  const deleteSubject = async (id: number) => {
    try {
      await apiClient.delete(`${API_URL}/${id}`);
      Alert.alert('Success', 'Subject deleted successfully.');
      fetchSubjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete subject.');
    }
  };

  // Handle Edit Button Click
  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectName(subject.name);
    setIsEditing(true);
    setIsModalVisible(true);
  };

  // Open modal for creating subject
  const openCreateSubjectModal = () => {
    setSubjectName('');
    setIsEditing(false);
    setIsModalVisible(true);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Manage Subjects</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateSubjectModal}>
          <Text style={styles.buttonText}>Add Subject</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.subjectItem}>
            <Text>{item.name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => handleEdit(item)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.buttonSpacing} />
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => deleteSubject(item.id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal for Create/Edit Subject */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Subject' : 'Add Subject'}</Text>
            <TextInput
              placeholder="Subject Name (Required)"
              value={subjectName}
              onChangeText={setSubjectName}
              style={styles.input}
            />
            <TouchableOpacity
              style={[styles.button, isEditing ? styles.editButton : styles.createButton]}
              onPress={isEditing ? updateSubject : createSubject}
            >
              <Text style={styles.buttonText}>{isEditing ? 'Update Subject' : 'Create Subject'}</Text>
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
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectItem: {
    flexDirection: 'row', // Layout in a row
    justifyContent: 'space-between', // Space between content and actions
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '100%', // Ensure it spans full width
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '40%',
    marginRight: 10,
  },
  buttonSpacing: {
    width: 10, // Adjust spacing between buttons
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
	paddingVertical: 5,
    paddingHorizontal: 10,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
	paddingVertical: 5,
    paddingHorizontal: 10,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    marginTop: 10,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    width: "100%",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.textLight,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
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
});

export default ManageSubjectsScreen;
