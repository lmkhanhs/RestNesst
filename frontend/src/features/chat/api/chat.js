import axios from "axios";

const CHAT_API_URL = "http://localhost:3000/api/chat";

export const sendMessage = async (message, history = []) => {
  try {
    const response = await axios.post(CHAT_API_URL, {
      message,
      history,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
