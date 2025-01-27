import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert, Modal, StyleSheet, Keyboard, TouchableOpacity } from 'react-native';
import apiClient from "./apiClient";
import theme from "../themes/default";

const API_URL = '/classes'; // Replace with your Laravel API endpoint

export const ManageClassesScreen: React.FC = () => {

  type SchoolClass = {
    id: number;
    name: string;
    teacher?: string;
  };

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [className, setClassName] = useState('');
  const [classTeacher, setClassTeacher] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch all classes
  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_URL);
      setClasses(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch classes.');
    }
  };

  // Create a new class
  const createClass = async () => {
    if (!className) {
      Alert.alert('Validation Error', 'Class name is required.');
      return;
    }
    try {
      await apiClient.post(API_URL, { name: className, teacher: classTeacher });
      Alert.alert('Success', 'Class created successfully.');
      setClassName('');
      setClassTeacher('');
      Keyboard.dismiss();
      setIsModalVisible(false);
      fetchClasses();
    } catch (error) {
      Alert.alert('Error', 'Failed to create class.');
    }
  };

  // Update an existing class
  const updateClass = async () => {
    if (!className || !selectedClass) {
      Alert.alert('Validation Error', 'Class name is required.');
      return;
    }
    try {
      await apiClient.put(`${API_URL}/${selectedClass.id}`, { name: className, teacher: classTeacher });
      Alert.alert('Success', 'Class updated successfully.');
      setClassName('');
      setClassTeacher('');
      setIsEditing(false);
      setSelectedClass(null);
      Keyboard.dismiss();
      setIsModalVisible(false);
      fetchClasses();
    } catch (error) {
      Alert.alert('Error', 'Failed to update class.');
    }
  };

  // Delete a class
  const deleteClass = async (id: number) => {
    try {
      await apiClient.delete(`${API_URL}/${id}`);
      Alert.alert('Success', 'Class deleted successfully.');
      fetchClasses();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete class.');
    }
  };

  // Handle Edit Button Click
  const handleEdit = (classItem: any) => {
    setSelectedClass(classItem);
    setClassName(classItem.name);
    setClassTeacher(classItem.teacher || '');
    setIsEditing(true);
    setIsModalVisible(true);
  };

  // Open modal for creating class
  const openCreateClassModal = () => {
    setClassName('');
    setClassTeacher('');
    setIsEditing(false);
    setIsModalVisible(true);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <View style={styles.container}>
		<View style={styles.pageHeader}>
			<Text style={styles.pageTitle}>Manage Classes</Text>
			<TouchableOpacity style={styles.addButton} onPress={openCreateClassModal}>
				<Text style={styles.buttonText}>Add Class</Text>
			</TouchableOpacity>
		</View>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.classItem}>
            <Text style={styles.classText}>
              {item.name} - {item.teacher || 'No Teacher Assigned'}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteClass(item.id)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal for Create/Edit Class */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Class' : 'Add Class'}</Text>
            <TextInput
              placeholder="Class Name (Required)"
              value={className}
              onChangeText={setClassName}
              style={styles.input}
            />
            <TextInput
              placeholder="Teacher (Optional)"
              value={classTeacher}
              onChangeText={setClassTeacher}
              style={styles.input}
            />
            <TouchableOpacity
              style={[styles.button, isEditing ? styles.editButton : styles.createButton]}
              onPress={isEditing ? updateClass : createClass}
            >
              <Text style={styles.buttonText}>{isEditing ? 'Update Class' : 'Create Class'}</Text>
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
  button: {
	paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  classText: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 90,
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
  buttonText: {
    color: theme.colors.textLight,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addButton: {
	backgroundColor: theme.colors.primary,
	paddingVertical: 10,
	paddingHorizontal: 20, // Increased padding for better button size
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

export default ManageClassesScreen;
