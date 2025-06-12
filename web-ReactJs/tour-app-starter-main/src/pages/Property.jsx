import React, { useEffect, useState } from "react";
import { Container, Stack, Typography } from "@mui/material";
import { Hero } from "../section/Property"; // Import Hero component
import { useParams } from "react-router-dom"; // Import useParams to get id from URL
import axiosInstance from "../api/axiosConfig";

const Property = () => {
  const { id } = useParams(); // Get the id from the URL
  const [property, setProperty] = useState(null); // State to store property data
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch data from API when the component mounts
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // Create a new axios instance without auth interceptor for public access
        const response = await axiosInstance.get(`/api/listings/${id}`, {
          headers: {
            Authorization: undefined, // Override the auth interceptor
          },
        });

        if (response.data.code === 200) {
          setProperty(response.data.result); // Save property data to state
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false); // Stop loading once data is fetched
      }
    };

    fetchProperty();
  }, [id]); // Use id as dependency to fetch data whenever it changes

  if (loading) {
    return <Typography>Loading...</Typography>; // Display loading message
  }

  if (!property) {
    return <Typography>Property not found!</Typography>; // If no property found
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Pass fetched data to Hero */}
        <Hero property={property} />
      </Stack>
    </Container>
  );
};

export default Property;
