import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import apiClient from "./apiClient";
import { RootStackParamList } from "../types";
import theme from "../themes/default";

type PlanningItem = {
  id?: number;
  className: string;
  class_name?: string;
  subject: string;
  pupils: string;
  content: string;
  date: string;
  created_at?: string;
  updated_at?: string;
};

type SchoolClass = {
  id: number;
  name: string;
};

type Subject = {
  id: number;
  name: string;
};

type Pupil = {
  id: number;
  name: string;
};

export const PlanningPage: React.FC = () => {
  const [plannings, setPlannings] = useState<PlanningItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPlanning, setEditingPlanning] = useState<PlanningItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupils, setSelectedPupils] = useState<number[]>([]);


  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
	const fetchData = async () => {
	  await fetchClassesAndSubjects();
	  await fetchPlannings();
	};
	fetchData();
  }, []);

  // Fetch all planning items
  const fetchPlannings = async () => {
	setLoading(true);
	try {
	  const response = await apiClient.get("/planning");
  
	  const mappedPlannings = response.data.map((planning: any) => {
		const className = classes.find((cls) => cls.id === planning.class_id)?.name || "Unknown Class";
		return { ...planning, className }; // Add className to each planning item
	  });
  
	  setPlannings(mappedPlannings);
	} catch (error) {
	  console.error("Error fetching plannings:", error);
	  Alert.alert("Error", "Failed to fetch planning items.");
	} finally {
	  setLoading(false);
	}
  };

  // Fetch all classes and subjects
  const fetchClassesAndSubjects = async () => {
    try {
      const [classResponse, subjectResponse] = await Promise.all([
        apiClient.get("/classes"),
        apiClient.get("/subjects"),
      ]);
      setClasses(classResponse.data);
      setSubjects(subjectResponse.data);
    } catch (error) {
      console.error("Error fetching classes or subjects:", error);
    }
  };

  // Fetch pupils for a specific class
  const fetchPupils = async (classId: number) => {
    try {
      const response = await apiClient.get(`/classes/${classId}/pupils`);
      setPupils(response.data);
    } catch (error) {
      console.error("Error fetching pupils:", error);
    }
  };

  const savePlanning = async () => {
	try {
	  if (!editingPlanning) return;
  
	  // Prepare payload
	  const payload = {
		...editingPlanning,
		date: editingPlanning?.date || new Date().toISOString().split("T")[0],
		pupils: selectedPupils
		  .map((pupilId) => pupils.find((pupil) => pupil.id === pupilId)?.name)
		  .filter(Boolean) // Remove any undefined or null values
		  .join(", "), // Convert to a comma-separated string
	  };

	  delete payload.class_name;

	  if (isAdding) {
		await apiClient.post("/planning", payload);
	  } else {
		await apiClient.put(`/planning/${editingPlanning.id}`, payload);
	  }
  
	  setEditingPlanning(null);
	  setIsAdding(false);
	  fetchPlannings();
	} catch (error: any) {
	  console.error("Save Header Error:", error);
		
		  if (error.response) {
			// Server returned a response (e.g., 4xx or 5xx)
			Alert.alert(
			  "Error",
			  error.response.data.message || "Failed to save the header."
			);
		  } else if (error.request) {
			// No response received
			Alert.alert(
			  "Error",
			  "Unable to reach the server. Please check your connection."
			);
		  } else {
			// Something else happened
			Alert.alert("Error", error.message || "An unexpected error occurred.");
		  }
	}
  };

  // Handle checkbox toggle for pupils
  const togglePupilSelection = (pupilId: number) => {
    setSelectedPupils((prevSelected) =>
      prevSelected.includes(pupilId)
        ? prevSelected.filter((id) => id !== pupilId)
        : [...prevSelected, pupilId]
    );
  };

  const deletePlanning = async (id: number) => {
    try {
      await apiClient.delete(`/plannings/${id}`);
      fetchPlannings();
    } catch (error) {
      console.error("Error deleting planning item:", error);
      Alert.alert("Error", "Failed to delete planning item.");
    }
  };

  const navigateToNotes = (planningItemId: number) => {
	navigation.navigate("NotesScreen", { planningItemId });
  };


  useEffect(() => {
    fetchPlannings();
    fetchClassesAndSubjects();
  }, []);

  return (
    <View style={styles.container}>
		<View style={styles.pageHeader}>
			<Text style={styles.pageTitle}>Planning Items</Text>
			<TouchableOpacity
				style={styles.addButton}
				onPress={() => {
				setEditingPlanning({
					className: "",
					class_name: "",
					subject: "",
					pupils: "",
					content: "",
					date: ""
				});
				setSelectedPupils([]); // Clear selected pupils
				setPupils([]); // Clear the pupils list
				setIsAdding(true);
				}}
			>
				<Text style={styles.addButtonText}>Add New Planning</Text>
			</TouchableOpacity>
		</View>

      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <ScrollView>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>Class</Text>
              <Text style={styles.headerText}>Subject</Text>
              <Text style={styles.headerText}>Pupils</Text>
              <Text style={styles.headerText}>Date</Text>
              <Text style={styles.headerText}>Actions</Text>
            </View>
            {plannings.map((planning) => (
              <View key={planning.id} style={styles.tableRow}>
                <Text style={styles.rowText}>{planning.class_name}</Text>
                <Text style={styles.rowText}>{planning.subject}</Text>
                <Text style={styles.rowText}>{planning.pupils}</Text>
                <Text style={styles.rowText}>
					{planning.created_at
						? new Date(planning.created_at).toISOString().slice(0, 10) // Format the date
						: "N/A" // Fallback if created_at is undefined
					}
				</Text>
				<View
					style={styles.iconContainer}
				>
				<TouchableOpacity
					style={styles.iconItem}
                  onPress={() => setEditingPlanning(planning)}
                >
                  <MaterialIcons name="edit" size={30} style={styles.actionItem} />
                </TouchableOpacity>
				<TouchableOpacity
					// style={styles.notesButton}
					onPress={() => navigateToNotes(planning.id!)}
					>
					<MaterialIcons name="note" size={30} style={styles.actionItem} />
				</TouchableOpacity>
				{/* <TouchableOpacity
				style={styles.iconItem}
                  onPress={() => deletePlanning(planning.id!)}
                >
                  <MaterialIcons name="delete" size={30} color="red" />
                </TouchableOpacity> */}
				</View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {(isAdding || editingPlanning) && (
        <View style={styles.formContainer}>
			 <ScrollView>
			<Text style={styles.modalTitle}>
				{isAdding ? "Add New Planning" : "Edit Planning"}
			</Text>
			<Picker
				selectedValue={editingPlanning?.className}
				onValueChange={(value) => {
				setEditingPlanning((prev) => prev && { ...prev, className: value });
				const selectedClass = classes.find((cls) => cls.name === value);
				if (selectedClass) fetchPupils(selectedClass.id);
				}}
			>
				<Picker.Item label="Select a Class" value="" />
				{classes.map((cls) => (
				<Picker.Item key={cls.id} label={cls.name} value={cls.name} />
				))}
			</Picker>
			<Picker
				selectedValue={editingPlanning?.subject}
				onValueChange={(value) =>
				setEditingPlanning((prev) => prev && { ...prev, subject: value })
				}
			>
				<Picker.Item label="Select a Subject" value="" />
				{subjects.map((sub) => (
				<Picker.Item key={sub.id} label={sub.name} value={sub.name} />
				))}
			</Picker>
			<Text style={styles.pupilsLabel}>Pupils:</Text>
			{pupils.map((pupil) => (
				<View key={pupil.id} style={styles.checkboxContainer}>
				<TouchableOpacity
					style={styles.checkbox}
					onPress={() => togglePupilSelection(pupil.id)}
				>
					{selectedPupils.includes(pupil.id) && (
					<Text style={styles.checkboxTick}>✔</Text>
					)}
				</TouchableOpacity>
				<Text>{pupil.name}</Text>
				</View>
			))}
			
			<TouchableOpacity style={styles.saveButton} onPress={savePlanning}>
				<Text style={styles.saveButtonText}>Save</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.cancelButton}
				onPress={() => {
				setEditingPlanning(null);
				setIsAdding(false);
				}}
			>
				<Text style={styles.cancelButtonText}>Cancel</Text>
			</TouchableOpacity>
		  </ScrollView>
        </View>
      )}
    </View>
  );
};

export default PlanningPage;

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
	scrollView: { marginBottom: 20, backgroundColor: "#ffffff" },
	planningItem: {
	  borderBottomWidth: 1,
	  borderBottomColor: "#ccc",
	  paddingVertical: 15,
	  paddingHorizontal: 10,
	  backgroundColor: "#fff",
	  marginBottom: 10,
	  borderRadius: 5,
	},
	pupilsLabel: {
		padding:10,
	},
	checkboxContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
		marginLeft:10,
		paddingVertical:20,
	},
	checkbox: {
		width: 30,
		height: 30,
		borderWidth: 1,
		borderColor: "#ccc",
		marginRight: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxTick: {
		fontSize: 14,
		color: "blue",
	},
	infoText: { fontSize: 16, color: "#333", marginBottom: 5 },
	label: { fontWeight: "bold" },
	actionButtons: { flexDirection: "row", marginTop: 10 },
	editButton: {
	  flex: 1,
	  backgroundColor: theme.colors.primary,
	  padding: 10,
	  borderRadius: 5,
	  marginRight: 10,
	},
	editButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },
	deleteButton: {
	  flex: 1,
	  backgroundColor: theme.colors.error,
	  padding: 10,
	  borderRadius: 5,
	},
	deleteButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },
	formContainer: {
	  padding: 20,
	  backgroundColor: "#fff",
	  borderRadius: 5,
	  elevation: 10,
	  marginBottom: 60,
	},
	modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
	input: {
	  borderWidth: 1,
	  borderColor: "#ccc",
	  padding: 10,
	  borderRadius: 5,
	  marginBottom: 10,
	},
	largeInput: {
	  borderWidth: 1,
	  borderColor: "#ccc",
	  padding: 10,
	  borderRadius: 5,
	  textAlignVertical: "top",
	  height: 100,
	  marginBottom: 10,
	},
	saveButton: {
	  backgroundColor: theme.colors.primary,
	  padding: 15,
	  borderRadius: 5,
	  marginBottom: 10,
	},
	saveButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },
	cancelButton: {
	  backgroundColor: theme.colors.error,
	  padding: 15,
	  borderRadius: 5,
	},
	cancelButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },
	loadingText: { fontSize: 18, textAlign: "center", color: "#555" },

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
	  tableContainer: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
		overflow: "hidden",
	  },
	  tableHeader: {
		flexDirection: "row",
		backgroundColor: "#f0f0f0",
		paddingVertical: 10,
		paddingHorizontal: 5,
	  },
	  tableRow: {
		flexDirection: "row",
		paddingVertical: 10,
		paddingHorizontal: 5,
		borderBottomWidth: 1,
		borderBottomColor: "#ccc",
		backgroundColor: "#ffffff",
	  },
	  headerText: {
		flex: 1,
		fontWeight: "bold",
		fontSize: 16,
		textAlign: "center",
	  },
	  rowText: {
		flex: 1,
		fontSize: 14,
		textAlign: "center",
	  },
	  iconContainer: {
		flex: 1,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
	  },
	  iconItem: {
		marginRight: 40,
		color: theme.colors.primary,
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
	  addButton: {
		backgroundColor: theme.colors.primary,
		paddingVertical: 10,
		paddingHorizontal: 20, // Increased padding for better button size
		borderRadius: 5,
	  },
	  addButtonText: {
		color: "white",
		textAlign: "center",
		fontWeight: "bold",
	  },
	  button: {
		paddingHorizontal: 10,
		borderRadius: 5,
	  },
	  buttonText: {
	  },
	  actionItem: {
		color: theme.colors.primary,
	  }
  });
  
