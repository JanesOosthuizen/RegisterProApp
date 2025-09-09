import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create Axios instance
const apiClient = axios.create({
	baseURL: "https://rpro.px2.co.za/api", // Base URL for your API
	headers: {
		"Content-Type": "application/json",
	},
});

// Add a request interceptor
apiClient.interceptors.request.use(
	async (config) => {
		const token = typeof window !== "undefined" ? await AsyncStorage.getItem("token") : null; // Retrieve token
		if (token) {
			config.headers.Authorization = `Bearer ${token}`; // Add token to headers
		}
		return config;
	},
	(error) => {
		// Handle errors
		return Promise.reject(error);
	}
);

export default apiClient;
