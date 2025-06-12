import axios from "axios";

const API_URL = "http://localhost:3000/api/chat";

export const sendMessage = async (message) => {
  try {
    const response = await axios.post(
      API_URL,
      { message },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending message to chatbot:", error);
    throw error;
  }
};
