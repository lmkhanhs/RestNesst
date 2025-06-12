import axios from "axios";

const API_URL = "http://localhost:5000"; // URL của server Python

export const analyzeSentiment = async (text) => {
  try {
    const response = await axios.post(`${API_URL}/analyze-sentiment`, { text });
    return response.data.sentiment;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return null;
  }
};
