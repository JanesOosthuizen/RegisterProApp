import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  GestureResponderEvent
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import apiClient from "./apiClient";
import theme from "../themes/default";

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
  class_id: number;
};

type Header = {
  id?: number;
  column_index: number;
  title: string;
  subtitle: string;
};

type PlanningItem = {
	id?: number;
	className: string;
	subject: string;
	pupils: string;
	content: string;
  };

export const DashboardScreen: React.FC = () => {
  const [headers, setHeaders] = useState<Header[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedHeader, setSelectedHeader] = useState<Header | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>();
  const [selectedFilterClassId, setSelectedFilterClassId] = useState<number | undefined>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [isCellSlideOutVisible, setIsCellSlideOutVisible] = useState(false);
  const [isHeaderSlideOutVisible, setIsHeaderSlideOutVisible] = useState(false);
  const [cellData, setCellData] = useState<Record<string, { className: string; subjectName: string, pupilIds: number[] }>>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);
  const [classPupils, setClassPupils] = useState<Pupil[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPupils, setSelectedPupils] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false); // State to toggle between view and edit modes
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
	const [newPlanningItem, setNewPlanningItem] = useState<PlanningItem>({
	className: "",
	subject: "",
	pupils: "",
	content: "",
	});
	const [isAddingPlanningItem, setIsAddingPlanningItem] = useState(false);
	const [isEmailModalVisible, setIsEmailModalVisible] = useState(false); // Controls email modal visibility
	const [emailAddress, setEmailAddress] = useState(''); // Store the email address
	const [emailError, setEmailError] = useState(''); // To handle email validation errors
	const [isDeleting, setIsDeleting] = useState(false);

	const [menuVisible, setMenuVisible] = useState(false);
  	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

	const handleLongPress =  (rowIndex: number, columnIndex: number) => (event: GestureResponderEvent) => {
		const { pageX, pageY } = event.nativeEvent;
		
		// Estimate menu height (e.g., 2 items * 50px + padding) and add a buffer
		const estimatedMenuHeight = 100; // Adjust based on your ContextMenu height
		const buffer = 20; // Space between finger and menu
		const adjustedY = pageY - estimatedMenuHeight - buffer;
		
		const cellKey = `${rowIndex}-${columnIndex}`;
		const cellContent = cellData[cellKey] || {};
	
		if (cellContent.className) {
			const selectedClass = classes.find((cls) => cls.name === cellContent.className);
			if (selectedClass) {
			fetchPupilsByClass(selectedClass.id);
			}
		}
	
		if (cellContent.className) {
			const selectedClass = classes.find((cls) => cls.name === cellContent.className);
			if (selectedClass) {
			  fetchPupilsByClass(selectedClass.id);
			  setSelectedClassId(selectedClass.id); // Set the selected class for the picker
			} else {
			  setSelectedClassId(undefined); // Reset if no matching class is found
			}
		  } else {
			setSelectedClassId(undefined); // Reset if no class is set
		  }
		
		  if (cellContent.subjectName) {
			const selectedSubject = subjects.find((sub) => sub.name === cellContent.subjectName);
			if (selectedSubject) {
			  setSelectedSubjectId(selectedSubject.id); // Set the selected subject for the picker
			} else {
			  setSelectedSubjectId(undefined); // Reset if no matching subject is found
			}
		  } else {
			setSelectedSubjectId(undefined); // Reset if no subject is set
		  }

		// Set position, keeping x centered and y above the press
		setMenuPosition({ x: pageX, y: adjustedY });
		setMenuVisible(true);
		// setIsCellSlideOutVisible(true);
	};

	const handleMenuSelect = (option: any) => {
		console.log(`Selected: ${option}`);
		setMenuVisible(false); // Close the menu after selection
	};

  useEffect(() => {
    fetchClassesAndSubjects();
    fetchHeaders();
    fetchCellData();
  }, []);

  const fetchClassesAndSubjects = async () => {
	try {
	  const [classRes, subjectRes] = await Promise.all([
		apiClient.get("/classes"),
		apiClient.get("/subjects"),
	  ]);
	  setClasses(classRes.data);
	  setSubjects(subjectRes.data);
	} catch (error) {
	  console.error("Error fetching classes or subjects:", error);
	}
  };

  const fetchHeaders = async () => {
	  try {
		const response = await apiClient.get("/headers");
		const fetchedHeaders = response.data;
	
		// Map headers to ensure correct order and placeholders
		const mappedHeaders = Array.from({ length: 15 }, (_, i) => {
		  const header = fetchedHeaders.find((h: Header) => h.column_index === i);
		  return (
			header || {
			  id: undefined, // No ID if it doesn't exist on the server
			  column_index: i,
			  title: `Header ${i + 1}`, // Placeholder
			  subtitle: `Subtitle ${i + 1}`, // Placeholder
			}
		  );
		});
	
		setHeaders(mappedHeaders);
	  } catch (error) {
		console.error("Error fetching headers:", error);
		Alert.alert("Error", "Failed to fetch headers.");
	  }
	};

  const fetchCellData = async () => {
	try {
	  const response = await apiClient.get("/cell-assignments");
	  const fetchedCellData = response.data;

	  const transformedData: Record<string, { className: string; subjectName: string, pupilIds: number[] }> = {};
	  fetchedCellData.forEach((cell: any) => {
		const key = `${cell.row}-${cell.column}`;
		transformedData[key] = {
		  className: cell.class_name || "",
		  subjectName: cell.subject_name || "",
		  pupilIds: cell.pupil_ids || [],
		};
	  });

	  setCellData(transformedData);
	} catch (error) {
	  console.error("Error fetching cell data:", error);
	}
  };

  const handleClassFilterChange = (classId: number | undefined) => {
    setSelectedFilterClassId(classId);
  };

  const shouldShowCellContent = (className: string) => {
    if (selectedFilterClassId == 0) {
		return true; 
	} else {
		// Show all content if no filter is applied
		const selectedClass = classes.find((cls) => cls.id === selectedFilterClassId);
		return selectedClass?.name === className; // Show only content matching the selected class
	}
  };

//   const fetchPupils = async (classId: number) => {
//     try {
//       const response = await apiClient.get(`/classes/${classId}/pupils`);
//       setPupils(response.data);
//     } catch (error) {
//       console.error("Error fetching pupils:", error);
//       Alert.alert("Error", "Failed to fetch pupils. Please try again.");
//     }
//   };

	const fetchPlanningItems = async (cellKey: string) => {
		console.log(cellKey);
	try {
		const response = await apiClient.get(`/cell-planning/${cellKey}`);
		setPlanningItems(response.data); // Ensure response.data matches PlanningItem[]
	} catch (error) {
		console.error("Error fetching planning items:", error);
	}
	};

	const syncData = async () => {
		setLoading(true); // Show a loading indicator while syncing
		try {
			fetchClassesAndSubjects();
			fetchHeaders();
			fetchCellData();
		  Alert.alert("Success", "Data synced successfully.");
		} catch (error) {
		  console.error("Error syncing data:", error);
		  Alert.alert("Error", "Failed to sync data. Please try again.");
		} finally {
		  setLoading(false); // Hide the loading indicator
		}
	  };


  const togglePupilSelection = (pupilId: number) => {
    setSelectedPupils((prevSelected) =>
      prevSelected.includes(pupilId)
        ? prevSelected.filter((id) => id !== pupilId)
        : [...prevSelected, pupilId]
    );
  };

  const handleHeaderPress = (index: number) => {
    const header = headers.find((h) => h.column_index === index);
    setSelectedHeader(header || { id: 0, column_index: index, title: "", subtitle: "" });
    setIsHeaderSlideOutVisible(true);
  };

  const saveHeaderChanges = async () => {
	if (!selectedHeader) {
	  Alert.alert("Error", "No header selected.");
	  return;
	}
  
	try {
	  const payload = {
		column_index: selectedHeader.column_index,
		title: selectedHeader.title || `Header ${selectedHeader.column_index + 1}`,
		subtitle: selectedHeader.subtitle || `Subtitle ${selectedHeader.column_index + 1}`,
	  };
    
	  let updatedHeader;
	  if (selectedHeader.id) {
		// Update existing header
		const response = await apiClient.put(`/headers/${selectedHeader.id}`, payload);
		console.log("Updating Header:", response.data);
		updatedHeader = response.data;
	  } else {
		// Create new header
		const response = await apiClient.post("/headers", payload);
		console.log("Creating Header:", response.data);
		updatedHeader = response.data;
	  }
  
	  // Update the headers state locally
	  setHeaders((prev) =>
		prev.map((header) =>
		  header.column_index === updatedHeader.column_index
			? updatedHeader
			: header
		)
	  );
  
	  setIsHeaderSlideOutVisible(false);
	  Alert.alert("Success", "Header saved successfully.");
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
  
  const fetchPupilsByClass = async (classId: number) => {
	try {
	  const response = await apiClient.get(`/classes/${classId}/pupils`);
	  setClassPupils(response.data);
	} catch (error) {
	  console.error("Error fetching pupils:", error);
	  Alert.alert("Error", "Failed to fetch pupils for the selected class.");
	}
  };

  const handleCellPress = (row: number, column: number) => {
    const cellKey = `${row}-${column}`;
	const cellContent = cellData[cellKey] || {};

	if (cellContent.className) {
		const selectedClass = classes.find((cls) => cls.name === cellContent.className);
		if (selectedClass) {
		fetchPupilsByClass(selectedClass.id);
		}
	}

	if (cellContent.className) {
		const selectedClass = classes.find((cls) => cls.name === cellContent.className);
		if (selectedClass) {
		  fetchPupilsByClass(selectedClass.id);
		  setSelectedClassId(selectedClass.id); // Set the selected class for the picker
		} else {
		  setSelectedClassId(undefined); // Reset if no matching class is found
		}
	  } else {
		setSelectedClassId(undefined); // Reset if no class is set
	  }
	
	  if (cellContent.subjectName) {
		const selectedSubject = subjects.find((sub) => sub.name === cellContent.subjectName);
		if (selectedSubject) {
		  setSelectedSubjectId(selectedSubject.id); // Set the selected subject for the picker
		} else {
		  setSelectedSubjectId(undefined); // Reset if no matching subject is found
		}
	  } else {
		setSelectedSubjectId(undefined); // Reset if no subject is set
	  }

	console.log(cellContent);

	setSelectedPupils(cellContent.pupilIds || []);

	setSelectedCell({ row, column });
	setIsCellSlideOutVisible(true);
	// fetchPlanningItems(cellKey);
  };

  const handleDelete = async (row: number, column: number) => {
    // Confirm before making the API call
	console.log('delete');
    // const confirmDelete = window.confirm('Are you sure you want to delete this assignment?');
    // if (!confirmDelete) return;

    setIsDeleting(true);

    try {
	  const response = await apiClient.delete(`/cell-assignments/${row}-${column}`); 
	  fetchClassesAndSubjects();
		fetchHeaders();
		fetchCellData();
	  	setIsCellSlideOutVisible(false)
    	// Alert.alert('Success');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete the assignment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const saveCellAssignment = async () => {
    if (!selectedCell) {
      Alert.alert("Error", "No cell selected.");
      return;
    }

	const payload = {
		row: selectedCell.row,
		column: selectedCell.column,
		class_id: selectedClassId || null,
		subject_id: selectedSubjectId || null,
		pupil_ids: selectedPupils,
	  };
	
	console.log("Payload being sent:", payload);

    const existingData = cellData[`${selectedCell.row}-${selectedCell.column}`] || {};
    const className = selectedClassId
      ? classes.find((cls) => cls.id === selectedClassId)?.name || existingData.className || ""
      : existingData.className || "";
    const subjectName = selectedSubjectId
      ? subjects.find((sub) => sub.id === selectedSubjectId)?.name || existingData.subjectName || ""
      : existingData.subjectName || "";

    if (!className && !subjectName) {
      Alert.alert("Error", "Please select at least a class or a subject.");
      return;
    }

	if (selectedPupils.length === 0) {
		Alert.alert("Error", "Please select at least one pupil.");
		return;
	  }

    try {
      setCellData((prev) => ({
        ...prev,
        [`${selectedCell.row}-${selectedCell.column}`]: { 
			className, 
			subjectName, 
			pupilIds: selectedPupils,
		},
      }));


      await apiClient.post("/cell-assignments", payload );

      Alert.alert("Success", "Assignment saved successfully.");
    //   setIsCellSlideOutVisible(false);
    } catch (error: any) {
		
		  if (error.response) {
			// Server returned a response (e.g., 4xx or 5xx)
			Alert.alert("Error", error.response.data.message || "couldnt save cell assignment.");
		  } else if (error.request) {
			// No response received
			Alert.alert("Error", "Unable to reach the server. Please check your connection.");
		  } else {
			// Something else happened
			Alert.alert("Error", error.message || "An unexpected error occurred.");
		  }
    }
  };

  const handleExport = async () => {
	if (!selectedClassId) {
	  Alert.alert("Error", "Please select a class to export.");
	  return;
	}
  
	const selectedClass = classes.find((cls) => cls.id === selectedClassId);
	const filteredData = Object.entries(cellData)
	  .filter(([, content]) => content.className === selectedClass?.name)
	  .map(([key, content]) => ({
		key,
		...content,
	  }));

	  const payload = {
		className: selectedClass?.name,
		data: filteredData,
	  };
  
	  console.log(payload);
	try {
	  await apiClient.post("/export-register", payload);
	  Alert.alert("Success", "The register has been exported and emailed.");
	} catch (error) {
	  console.error("Error exporting register:", error);
	  Alert.alert("Error", "Failed to export the register.");
	}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
		 <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Class:</Text>
        <Picker
          selectedValue={selectedClassId}
          onValueChange={handleClassFilterChange}
          style={styles.picker}
        >
          <Picker.Item label="All Classes" value="0" />
          {classes.map((cls) => (
            <Picker.Item key={cls.id} label={cls.name} value={cls.id} />
          ))}
        </Picker>
		<TouchableOpacity
		style={styles.exportButton} 
		onPress={handleExport}>
		{/* <Text style={styles.exportButtonText}>Export to PDF</Text> */}
		</TouchableOpacity>
      </View>
      <ScrollView horizontal>
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.firstColumn]}>
				<TouchableOpacity style={styles.syncButton} onPress={syncData}>
					<Text style={styles.syncButtonText}>Refresh Data</Text>
				</TouchableOpacity>
            </View>
            {headers.map((header, index) => (
              <TouchableOpacity
                key={`header-${index}`}
                style={[styles.cell, styles.headerCell]}
                onPress={() => handleHeaderPress(index)}
              >
                <Text style={styles.headerText}>{header.title}</Text>
                <Text style={styles.subtitleText}>{header.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.row}>
              <View style={[styles.cell, styles.firstColumn]}>
                <Text style={styles.firstColumnCell}>{day}</Text>
              </View>
              {Array.from({ length: 15 }).map((_, columnIndex) => {
                const cellKey = `${rowIndex}-${columnIndex}`;
                const cellContent = cellData[cellKey] || {};

                return (
                  <TouchableOpacity
                    key={`cell-${rowIndex}-${columnIndex}`}
                    style={[styles.cell, styles.largeCell]}
					onPress={() => handleCellPress(rowIndex, columnIndex)}
					onLongPress={handleLongPress(rowIndex, columnIndex)}
                  >
					{shouldShowCellContent(cellContent.className) ? (
                        <>
                          <Text>{cellContent.className}</Text>
                          {cellContent.subjectName && (
                            <Text style={styles.cellSubtitleText}>
                              {cellContent.subjectName}
                            </Text>
                          )}
                        </>
                      ) : (
                        <Text style={styles.hiddenContent}></Text>
                      )}
                    {/* {cellContent.className ? (
                      <>
                        <Text>{cellContent.className}</Text>
                        {cellContent.subjectName && (
                          <Text style={styles.cellSubtitleText}>{cellContent.subjectName}</Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.cellText}></Text>
                    )} */}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Header Slide-Out Drawer */}
      <View style={[styles.slideOutContainer, isHeaderSlideOutVisible ? styles.visible : styles.hidden]}>
        <View style={styles.slideOutHeader}>
			<Text style={styles.modalTitle}>{isEditing ? "Edit Header" : "Header Details"}</Text>
          <TouchableOpacity onPress={() => setIsHeaderSlideOutVisible(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.slideOutContent}>
          {selectedHeader && (
            <>
              <TextInput
                style={styles.textInput}
                value={selectedHeader.title}
                onChangeText={(text) =>
                  setSelectedHeader((prev) => prev && { ...prev, title: text })
                }
                placeholder="Title"
              />
              <TextInput
                style={styles.textInput}
                value={selectedHeader.subtitle}
                onChangeText={(text) =>
                  setSelectedHeader((prev) => prev && { ...prev, subtitle: text })
                }
                placeholder="Subtitle"
              />
              <TouchableOpacity style={styles.saveButton} onPress={saveHeaderChanges}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </>
          )}
        </KeyboardAvoidingView>
      </View>

	  <Modal
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)} // Android back button support
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setMenuVisible(false)} // Close on outside tap
        >
          <View
            style={[
              styles.contextMenu,
              { top: menuPosition.y, left: menuPosition.x },
            ]}
          >
            {/* <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
				setMenuVisible(false)
				setIsCellSlideOutVisible(true)
			  	}
			  }
            >
              <Text>Option 1</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect('Option 2')}
            >
              <Text>Planning</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

	  {/* Cell Slide-Out Drawer */}
      <View style={[styles.slideOutContainer, isCellSlideOutVisible ? styles.visible : styles.hidden]}>
        <View style={styles.slideOutHeader}>
			<Text style={styles.modalTitle}>{isEditing ? "Edit Class" : "Class Details"}</Text>
          	<TouchableOpacity onPress={() => setIsCellSlideOutVisible(false)}>
            	<Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.slideOutContent}>
			<ScrollView>
			{isEditing ? (
				<>
					<Picker
						selectedValue={selectedClassId}
						onValueChange={(value) => {
							setSelectedClassId(value as number);
							if (value) fetchPupilsByClass(value as number); // Fetch pupils when a class is selected
						}}
					>
						<Picker.Item label="Select a Class" value={undefined} />
						{classes.map((cls) => (
						<Picker.Item key={cls.id} label={cls.name} value={cls.id} />
						))}
					</Picker>
					<Picker
						selectedValue={selectedSubjectId}
						onValueChange={(value) => setSelectedSubjectId(value as number)}
					>
						<Picker.Item label="Select a Subject" value={undefined} />
						{subjects.map((sub) => (
						<Picker.Item key={sub.id} label={sub.name} value={sub.id} />
						))}
					</Picker>
					{classPupils.length > 0 ? (
						<>
							<Text style={styles.modalTitle}>Select Pupils:</Text>
							{classPupils.map((pupil) => (
							<View key={pupil.id} style={styles.checkboxContainer}>
								<TouchableOpacity
								onPress={() => togglePupilSelection(pupil.id)}
								style={styles.checkbox}
								>
								{selectedPupils.includes(pupil.id) && <Text style={styles.checkboxTick}>✔</Text>}
								</TouchableOpacity>
								<Text style={styles.pupilName}>{pupil.name}</Text>
							</View>
							))}
						</>
					): (
						<Text style={styles.noPupilsText}>No pupils assigned to this class yet</Text>
						)}
					<TouchableOpacity 
						style={styles.saveButton} 
						onPress={() => {
							saveCellAssignment();
							setIsEditing(false); // Exit edit mode after saving
						  }}
					>
						<Text style={styles.saveButtonText}>Save</Text>
					</TouchableOpacity>
				</>
			) : ( 
				<>
				<Text style={styles.infoText}>
					<Text style={styles.label}>Class:</Text> {selectedClassId ? classes.find((cls) => cls.id === selectedClassId)?.name : "None"}
					</Text>
					<Text style={styles.infoText}>
					<Text style={styles.label}>Subject:</Text> {selectedSubjectId ? subjects.find((sub) => sub.id === selectedSubjectId)?.name : "None"}
					</Text>
					<Text style={styles.infoText}>
					<Text style={styles.label}>Pupils:</Text>{" "}
					{selectedPupils.length > 0
						? selectedPupils
							.map((pupilId) => classPupils.find((pupil) => pupil.id === pupilId)?.name)
							.filter(Boolean)
							.join(", ")
						: "None"}
					</Text>
					{planningItems.map((item, index) => (
					<View key={index} style={styles.planningItem}>
						<Text style={styles.infoText}>
						<Text style={styles.label}>Class:</Text> {item.className}
						</Text>
						<Text style={styles.infoText}>
						<Text style={styles.label}>Subject:</Text> {item.subject}
						</Text>
						<Text style={styles.infoText}>
						<Text style={styles.label}>Pupils:</Text> {item.pupils}
						</Text>
						<Text style={styles.infoText}>
						<Text style={styles.label}>Content:</Text> {item.content}
						</Text>
					</View>
					))}
					<TouchableOpacity
						style={styles.editButton}
						onPress={() => setIsEditing(true)}
					>
						<Text style={styles.editButtonText}>Edit</Text>
					</TouchableOpacity>
					<TouchableOpacity
						// title={isDeleting ? 'Deleting...' : 'Delete Assignment'}
						style={styles.deleteButton}
						onPress={() => {
							if (selectedCell) {
								handleDelete(selectedCell.row, selectedCell.column)
							}
						}}
						disabled={isDeleting}
					>
						<Text style={styles.deleteButtonText}>{isDeleting ? 'Deleting...' : 'Delete Cell Data'}</Text>
					</TouchableOpacity>
				</>
			)}
			</ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  contentContainer: { paddingBottom: 20, marginBottom: 20 },  
  tableContainer: { flexDirection: "column", marginTop: 20 },
  row: { flexDirection: "row" },
  deleteButton: {
	padding: 15,
	backgroundColor: theme.colors.error,
	marginTop: 20,
	borderRadius: 8,
  },
  cell: {
    padding: 10,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 2,
    width: 120,
  },
  planningItem: {
	borderBottomWidth: 1,
	borderBottomColor: "#ccc",
	paddingVertical: 10,
  },
  exportButton: {
	
  },
  deleteButtonText: {
	textAlign: "center",
	color: "#fff",
	fontWeight: "bold",
  },
  exportButtonText: {
	color: theme.colors.textLight,
  },
  cellText: {},
  largeCell: { height: 80 },
  firstColumn: { flex: 2, backgroundColor: theme.colors.primary, color: "#ffffff" },
  firstColumnCell: { color: "#ffffff" },
  headerCell: { backgroundColor: theme.colors.primary, borderRadius: 8, width: 120 },
  headerText: { fontWeight: "bold", color: "#fff" },
  subtitleText: { fontSize: 12, color: "#ffffff" },
  cellSubtitleText: { fontSize: 12, color: "#555" },
  slideOutContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#ffffff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    elevation: 10,
  },
  slideOutHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "center",
	justifyContent: "space-between",
	flexDirection: "row",
  },
  closeText: { fontSize: 16, color: theme.colors.primary },
  slideOutContent: { flex: 1, padding: 20 },
  visible: { display: "flex" },
  hidden: { display: "none" },
  modalTitle: { fontSize: 18, marginBottom: 10 },
  saveButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  saveButtonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  pupilName: {
	fontSize: 14,
	marginVertical: 5,
	color: "#333",
  }, 
  checkboxContainer: {
	flexDirection: "row",
	alignItems: "center",
	marginBottom: 10,
  },
  checkbox: {
	width: 20,
	height: 20,
	borderWidth: 1,
	borderColor: "#ccc",
	marginRight: 10,
	justifyContent: "center",
	alignItems: "center",
  },
  checkboxTick: {
	fontSize: 14,
	color: theme.colors.primary
  },
  noPupilsText: {
	fontSize: 16,
	color: "#555",
	textAlign: "center",
	marginTop: 10,
  },
  infoText: {
	fontSize: 16,
	color: "#333",
	marginVertical: 5,
  },
  label: {
	fontWeight: "bold",
  },
  editButton: {
	marginTop: 20,
	padding: 15,
	backgroundColor: theme.colors.primary,
	borderRadius: 8,
  },
  resetButton: {
	marginTop: 20,
	padding: 15,
	backgroundColor: theme.colors.primary,
	borderRadius: 8,
  },
  clearButtonText: {
	backgroundColor: "#ffffff",
  },
  editButtonText: {
	color: "white",
	textAlign: "center",
	fontWeight: "bold",
  },
  syncButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  syncButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  filterLabel: { fontSize: 16, marginRight: 10, color: theme.colors.textLight, },
  picker: { flex: 1, color: theme.colors.textLight, paddingVertical:0, marginVertical:0 },
  hiddenContent: { height: 0 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Semi-transparent background
  },
  contextMenu: {
    position: 'absolute',
	display: 'flex',
	flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});

export default DashboardScreen;