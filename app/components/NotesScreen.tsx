import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  Animated
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types"; // Adjust the path if necessary
import DateTimePicker from "@react-native-community/datetimepicker";
import apiClient from "./apiClient";
import theme from "../themes/default";

type Note = {
  id: number;
  date: string;
  content: string;
};

type NotesScreenProps = NativeStackScreenProps<RootStackParamList, "NotesScreen">;

const NotesScreen: React.FC<NotesScreenProps> = ({ route, navigation }) => {
  const { planningItemId } = route.params;

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState<Note>({ id: 0, date: "", content: "" });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isFullScreenEditorVisible, setIsFullScreenEditorVisible] = useState(false);
  const [fullScreenContent, setFullScreenContent] = useState("");

  const [planningDetails, setPlanningDetails] = useState<{ class_name: string, subject: string } | null>(null);

  useEffect(() => {
    fetchNotes();
	fetchPlanningDetails();
  }, []);

  const fetchPlanningDetails = async () => {
	try {
	  const response = await apiClient.get(`/planning/id/${planningItemId}`);
	  setPlanningDetails(response.data[0]); // Assuming response includes the class name
	} catch (error) {
	  console.error("Error fetching planning details:", error);
	  Alert.alert("Error", "Failed to fetch planning details.");
	}
  };

  const fetchNotes = async () => {
    try {
      const response = await apiClient.get(`/planning/${planningItemId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error("Error fetching notes:", error);
      Alert.alert("Error", "Failed to fetch notes.");
    }
  };

  const saveNote = async () => {
    if (!selectedNote?.date || !selectedNote?.content) {
      Alert.alert("Error", "Date and content are required.");
      return;
    }

    try {
      if (selectedNote.id) {
        await apiClient.put(`/notes/${selectedNote.id}`, {
          date: selectedNote.date,
          content: selectedNote.content,
        });
      } else {
        await apiClient.post(`/planning/${planningItemId}/notes`, {
          date: selectedNote.date,
          content: selectedNote.content,
        });
      }

      setSelectedNote(null!);
      setIsModalVisible(false);
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", "Failed to save note.");
    }
  };

//   const addNote = async () => {
//     try {
//       if (!newNote.date || !newNote.content) {
//         Alert.alert("Error", "Date and content are required.");
//         return;
//       }

//       await apiClient.post(`/planning/${planningItemId}/notes`, {
//         date: newNote.date,
//         content: newNote.content,
//       });
//       setNewNote({ id: 0, date: "", content: "" });
//       fetchNotes();
//     } catch (error) {
//       console.error("Error adding note:", error);
//       Alert.alert("Error", "Failed to add note.");
//     }
//   };

  const deleteNote = async (id: number) => {
    try {
      await apiClient.delete(`/notes/${id}`);
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      Alert.alert("Error", "Failed to delete note.");
    }
  };

  const handleDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setDate(date);
      setNewNote((prev) => ({ ...prev, date: date.toISOString().split("T")[0] }));
    }
  };

  const openModal = (note: Note | null) => {
    setSelectedNote(note || { id: 0, date: "", content: "" });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedNote(null);
  };

  const openEditor = () => {
    setFullScreenContent(selectedNote?.content || "");
    setIsFullScreenEditorVisible(true);
  };

  const saveEditorContent = () => {
    setSelectedNote((prev) => (prev ? { ...prev, content: fullScreenContent } : prev));
    setIsFullScreenEditorVisible(false);
  };

  return (
    <View style={styles.container}>
	  <View style={styles.headerContainer}>
		<Text style={styles.pageTitle}>{planningDetails ? `Planning: ${planningDetails.class_name}`+` - `+`${planningDetails.subject}` : "Loading..."}</Text>
		<TouchableOpacity
			style={styles.addButton}
			onPress={() => {
			setSelectedNote({ id: 0, date: "", content: "" });
			setIsModalVisible(true);
			}}
		>
			<Text style={styles.addButtonText}>Add Note</Text>
		</TouchableOpacity>
	</View>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Date</Text>
          <Text style={styles.headerText}>Content</Text>
          <Text style={styles.headerText}>Actions</Text>
        </View>
        <ScrollView>
          {notes.map((note) => (
            <View key={note.id} style={styles.tableRow}>
              <Text style={styles.rowText}>{note.date}</Text>
              <Text style={styles.rowText}>{note.content}</Text>
              <View style={styles.actionContainer}>
			  <TouchableOpacity
                style={styles.editButton}
                onPress={() => openModal(note)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNote(note.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.addNoteContainer}>
	  <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedNote?.id === 0 ? "Add Note" : "Edit Note"}
            </Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {selectedNote?.date ? `Selected Date: ${selectedNote.date}` : "Choose Date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={
                  selectedNote?.date ? new Date(selectedNote.date) : new Date()
                }
                mode="date"
                display="default"
                onChange={(_event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setSelectedNote((prev) =>
                      prev ? { ...prev, date: date.toISOString().split("T")[0] } : null
                    );
                  }
                }}
              />
            )}
            <TouchableOpacity onPress={openEditor}>
              <TextInput
                style={styles.largeInput}
                value={selectedNote?.content || ""}
                editable={false}
                placeholder="Click to edit content"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
	  {/* Full-Screen Editor */}
      {isFullScreenEditorVisible && (
        <Modal animationType="slide" transparent={false} visible={isFullScreenEditorVisible}>
          <View style={styles.fullScreenEditorContainer}>
            <TextInput
              style={styles.fullScreenInput}
              value={fullScreenContent}
              onChangeText={setFullScreenContent}
              multiline
              autoFocus
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveEditorContent}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsFullScreenEditorVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
      </View>
    </View>
  );
};

export default NotesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  notesList: { marginBottom: 20 },
  noteItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  noteDate: { fontSize: 14, color: "#888", marginBottom: 5 },
  noteContent: { fontSize: 16, marginBottom: 10 },
  deleteButton: { backgroundColor: theme.colors.error, padding: 10, borderRadius: 5 },
  deleteButtonText: { color: "#fff", textAlign: "center" },
  addNoteContainer: { marginTop: 20 },
  largeInput: { 
	paddingVertical: 10,
	paddingHorizontal: 10,
	backgroundColor: "#dddddd",
	color: "#333", 
	fontSize: 16,
	borderRadius: 8,
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%", // Ensure the container spans the full width
    paddingHorizontal: 10, // Add horizontal padding for spacing
    marginBottom: 20, // Add spacing below the headerr
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10, // Space between the title and button
	color: theme.colors.textLight,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  datePickerButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  datePickerText: { color: "#333", fontSize: 16 },
  fullScreenEditorContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  fullScreenInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  saveButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  cancelButton: {
    backgroundColor: theme.colors.error,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  tableContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 10,
  },
  headerText: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
	backgroundColor: "#ffffff",
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
  },
  actionContainer: {  
	flex:1,
	flexDirection: "row", // Aligns buttons in a row
    justifyContent: "center", // Aligns buttons to the right
    marginTop: 10, // Adds some spacing above the buttons
   },
  editButton: { backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, marginHorizontal:5 },
  editButtonText: { color: "#fff", textAlign: "center" },
});
