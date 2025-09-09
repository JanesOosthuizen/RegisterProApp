import React, { useState, useEffect } from "react";
import * as Updates from "expo-updates";
import { NavigationContainer } from "@react-navigation/native";
import { NavigationIndependentTree } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
	Text,
	View,
	Button,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { DashboardScreen } from "./components/DashboardScreen";
import { ManageClassesScreen } from "./components/ManageClassesScreen";
import { ManageSubjectsScreen } from "./components/ManageSubjectsScreen";
import { ManagePupilsScreen } from "./components/ManagePupilsScreen";
import { PlanningPage } from "./components/PlanningPage";
import { SettingsScreen } from "./components/SettingsScreen";
import NotesScreen from "./components/NotesScreen"
import * as ScreenOrientation from "expo-screen-orientation";
import { PaperProvider } from "react-native-paper";
import axios from "axios";
import { RootStackParamList } from "./types";
import theme from "./themes/default";

// Lock the screen orientation to landscape
console.log(Platform.OS);
if (Platform.OS !== "web") {
	ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
}

type StackOnlyNavigationProps<RouteName extends keyof RootStackParamList> = StackNavigationProp<RootStackParamList, RouteName>;
type DrawerOnlyNavigationProps<RouteName extends keyof RootStackParamList> = DrawerNavigationProp<RootStackParamList, RouteName>;

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

const LoginScreen: React.FC<{ navigation: StackOnlyNavigationProps<'Login'> }> = ({ navigation }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		async function checkForUpdates() {
			try {
				const update = await Updates.checkForUpdateAsync();
				if (update.isAvailable) {
					await Updates.fetchUpdateAsync();
					await Updates.reloadAsync(); // Reload the app to apply the update
				}
			} catch (error) {
				console.error("Error checking for updates:", error);
			}
		}

		checkForUpdates();
	}, []);

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please fill in all fields.");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("https://rpro.px2.co.za/api/login", {
				email,
				password,
			});

			// Save the token from the response
			const { access_token } = response.data;
			await AsyncStorage.setItem("token", access_token);

			// Redirect to Dashboard
			setLoading(false);
			navigation.replace("Dashboard");
		} catch (error: any) {
			setLoading(false);

			console.error("Login error:", error);

			if (error.response) {
				// Server returned a response (e.g., 4xx or 5xx)
				Alert.alert("Error", error.response.data.message || "Invalid login credentials.");
			} else if (error.request) {
				// No response received
				Alert.alert("Error", "Unable to reach the server. Please check your connection.");
			} else {
				// Something else happened
				Alert.alert("Error", error.message || "An unexpected error occurred.");
			}
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Login</Text>
			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<TouchableOpacity style={styles.button} onPress={handleLogin}>
				<Text style={styles.buttonText}>Login</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => navigation.navigate("Register")}>
				<Text style={styles.link}>Don’t have a profile? Register</Text>
			</TouchableOpacity>
		</View>
	);
};

const LogoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {

	const handleLogout = async () => {
		try {
			// Clear the stored token
			await AsyncStorage.removeItem("token");

			// Navigate back to the login screen
			navigation.reset({
				index: 0,
				routes: [{ name: "Login" }],
			});
		} catch (error) {
			Alert.alert("Error", "Failed to log out. Please try again.");
		}
	};

	return (
		<View style={styles.logoutContainer}>
			<Text style={styles.logoutText}>Are you sure you want to logout?</Text>
			<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
				<Text style={styles.logoutButtonText}>Logout</Text>
			</TouchableOpacity>
		</View>
	);
};

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {

	const [name, setName] = useState("");
	const [surname, setSurname] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleRegister = async () => {
		if (!name || !email || !password) {
			Alert.alert("Error", "Please fill in all fields.");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("https://rpro.px2.co.za/api/register", {
				name,
				surname,
				email,
				password,
			});

			console.log("Register response:", response.data);

			Alert.alert("Success", "Registration successful. Please log in.");
			setLoading(false);
			navigation.replace("Login");
		} catch (error: any) {
			setLoading(false);
			console.error("Register error:", error);

			if (error.response) {
				console.error("Error response:", error.response.data);
				Alert.alert("Error", error.response.data.message || "Registration failed. Please try again.");
			} else if (error.request) {
				Alert.alert("Error", "Unable to reach the server. Please check your connection.");
			} else {
				Alert.alert("Error", error.message || "An unexpected error occurred.");
			}
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Register</Text>
			<TextInput
				style={styles.input}
				placeholder="Name"
				value={name}
				onChangeText={setName}
				autoCapitalize="words"
			/>
			<TextInput
				style={styles.input}
				placeholder="Surname"
				value={surname}
				onChangeText={setSurname}
				autoCapitalize="words"
			/>
			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<TouchableOpacity style={styles.button} onPress={handleRegister}>
				<Text style={styles.buttonText}>{loading ? "Registering..." : "Register"}</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => navigation.navigate("Login")}>
				<Text style={styles.link}>Already have a profile? Log in.</Text>
			</TouchableOpacity>
		</View>
	);
};

const Page4: React.FC = () => <View style={styles.page}><Text>Page 4</Text></View>;

const DrawerNavigator = () => {

	return (
		<Drawer.Navigator initialRouteName="Dashboard">
			<Drawer.Screen name="Dashboard" component={DashboardScreen} />
			<Drawer.Screen name="Manage Classes" component={ManageClassesScreen} />
			<Drawer.Screen name="Manage Subjects" component={ManageSubjectsScreen} />
			<Drawer.Screen name="Manage Pupils" component={ManagePupilsScreen} />
			<Drawer.Screen name="Planning" component={PlanningPage} />
			<Drawer.Screen name="Settings" component={SettingsScreen} />
			<Drawer.Screen name="Logout" component={LogoutScreen} />
		</Drawer.Navigator>
	);
};

const AppStackNavigator = () => {
	return (
		<Stack.Navigator initialRouteName="Login">
			<Stack.Screen
				name="Login"
				component={LoginScreen}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="Register"
				component={RegisterScreen}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="Dashboard"
				component={DrawerNavigator}
				options={{ headerShown: false }}
			/>
			<Stack.Screen name="PlanningPage" component={PlanningPage} />
			<Stack.Screen name="NotesScreen" component={NotesScreen} />
		</Stack.Navigator>
	);
};

export default function App() {
	return (
		<PaperProvider>
			<NavigationIndependentTree>
				<NavigationContainer>
					<AppStackNavigator />
				</NavigationContainer>
			</NavigationIndependentTree>
		</PaperProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		padding: 20,
		backgroundColor: theme.colors.background, // Main color as background
	},
	title: {
		fontSize: 28,
		marginBottom: 20,
		textAlign: "center",
		color: theme.colors.textLight, // White text for contrast
		fontWeight: "bold",
	},
	input: {
		width: "100%",
		padding: 15, // Increased padding for better UX
		marginBottom: 15,
		borderRadius: 10, // Rounded corners for a modern feel
		backgroundColor: "#fff", // White background
		fontSize: 16,
	},
	button: {
		padding: 15,
		backgroundColor: theme.colors.primary, // Accent color for buttons
		borderRadius: 25, // Fully rounded for a fun look
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: {
		color: "#fff", // White text
		fontWeight: "bold",
		fontSize: 18,
	},
	link: {
		color: "#ffffff", // Yellow for links
		textAlign: "center",
		marginTop: 25,
		textDecorationLine: "underline",
		fontSize: 18,
	},
	page: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#96ccb3", // Main color for background
	},
	pupilItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
		padding: 15,
		borderWidth: 1,
		borderColor: "#fee354", // Yellow for borders
		borderRadius: 10,
		backgroundColor: "#fff",
		shadowColor: "#000", // Subtle shadow for depth
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	actions: {
		flexDirection: "row",
		justifyContent: "space-between",
		width: 100,
	},
	header: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff", // White text
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 16,
		color: "#fee354", // Yellow accent
	},
	list: {
		backgroundColor: "#96ccb3", // Main color
	},
	logoutContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#96ccb3",
	},
	logoutText: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#333",
	},
	logoutButton: {
		padding: 15,
		backgroundColor: "#fe5e56",
		borderRadius: 10,
	},
	logoutButtonText: {
		fontSize: 16,
		color: "#fff",
		fontWeight: "bold",
		textAlign: "center",
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


