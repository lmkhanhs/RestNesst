import React, { useEffect, useState } from "react";
import { Box, Typography, Chip } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import PropTypes from "prop-types";

const RatingDisplay = ({ rating, reviewCount, reviews }) => {
  const [reviewsWithSentiment, setReviewsWithSentiment] = useState(reviews);

  useEffect(() => {
    setReviewsWithSentiment(reviews);
  }, [reviews]);

  // Calculate the number of filled and unfilled stars based on the rating
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const handleClick = () => {
    const reviewsDialog = document.createElement("dialog");
    reviewsDialog.style.cssText = `
      padding: 0;
      border-radius: 16px;
      border: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      background: #ffffff;
      color: #333333;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 900px;
      max-width: 1200px;
      width: 90vw;
      max-height: 92vh;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    // Add keyframes for dialog animation
    const style = document.createElement("style");
    style.textContent = `
      .review-card {
        transition: all 0.2s ease;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(33,150,243,0.06);
        border: 1px solid #e3eaf3;
        margin-bottom: 24px;
        padding: 28px 24px 20px 24px;
        display: flex;
        flex-direction: column;
        min-height: 180px;
      }
      .review-card:hover {
        background-color: #f4faff;
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 4px 24px rgba(33,150,243,0.13);
      }
      .review-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px 32px;
      }
      @media (max-width: 900px) {
        .review-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);

    const renderReviews = () => {
      if (reviewsWithSentiment.length === 0) {
        return `
          <div style="text-align: center; padding: 32px 20px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
            <span style="font-size: 32px;">📝</span>
            <p style="color: #6c757d; font-size: 15px; margin-top: 12px;">Chưa có đánh giá nào</p>
          </div>
        `;
      }
      return (
        `<div class='review-grid'>` +
        reviewsWithSentiment
          .map(
            (review) => `
        <div class="review-card">
          <div style="display: flex; align-items: center; margin-bottom: 18px;">
            <img 
              src="${
                review.thumbnailUrl ||
                `https://ui-avatars.com/api/?background=2196F3&color=fff&name=${review.username}`
              }" 
              style="width: 54px; height: 54px; border-radius: 50%; margin-right: 18px; object-fit: cover; border: 2px solid #e3eaf3; box-shadow: 0 2px 8px #e3eaf3;"
            />
            <div>
              <div style="font-weight: 600; color: #212529; font-size: 17px;">${
                review.username
              }</div>
              <div style="color: #6c757d; font-size: 14px; margin-top: 2px;">${
                review.reviewDate
              }</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            ${Array(Math.floor(review.rating))
              .fill("<span style='color:#FFD700;font-size:20px;'>★</span>")
              .join("")}
            <span style="margin-left: 10px; color: #2196F3; font-weight: 600; font-size: 16px;">${
              review.rating
            }</span>
            <span style="margin-left: 10px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: ${
              review.status === "POSITIVE" ? "#e8f5e9" : "#ffebee"
            }; color: ${
              review.status === "POSITIVE" ? "#2e7d32" : "#c62828"
            };">
              ${review.status === "POSITIVE" ? "Tích cực" : "Tiêu cực"}
            </span>
          </div>
          <p style="margin: 0 0 10px 0; color: #495057; line-height: 1.6; font-size: 15px;">${
            review.comment
          }</p>
          ${
            review.reviewUrl
              ? `<div style='margin-top: 8px;'><img src='${review.reviewUrl}' alt='review' style='max-width: 100%; border-radius: 8px; border: 1px solid #e3eaf3; box-shadow: 0 2px 8px #e3eaf3;'/></div>`
              : ""
          }
        </div>
      `
          )
          .join("") +
        `</div>`
      );
    };

    const content = document.createElement("div");
    content.style.cssText = `
      padding: 40px 48px 32px 48px;
      max-height: 86vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #dee2e6 transparent;
      background: #f7fafd;
    `;
    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <span style="font-size: 28px;">⭐</span>
        <h2 style="margin: 0; color: #212529; font-size: 24px; font-weight: 500;">Đánh giá của khách</h2>
      </div>
      <h3 style="color: #212529; font-size: 18px; margin-bottom: 16px; font-weight: 500; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">📝</span> Đánh giá gần đây
      </h3>
      <div id="recentReviews">${renderReviews()}</div>
    `;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = '<span style="font-size: 18px;">✕</span> Đóng';
    closeButton.style.cssText = `
      margin: 20px auto;
      padding: 10px 24px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    `;
    closeButton.onmouseover = () => {
      closeButton.style.background = "#1976D2";
      closeButton.style.transform = "translateY(-1px)";
    };
    closeButton.onmouseout = () => {
      closeButton.style.background = "#2196F3";
      closeButton.style.transform = "translateY(0)";
    };
    closeButton.onclick = () => {
      reviewsDialog.style.opacity = "0";
      setTimeout(() => reviewsDialog.close(), 200);
    };

    reviewsDialog.appendChild(content);
    reviewsDialog.appendChild(closeButton);
    document.body.appendChild(reviewsDialog);
    reviewsDialog.showModal();

    // Show dialog with fade in
    setTimeout(() => {
      reviewsDialog.style.opacity = "1";
    }, 0);
  };

  return (
    <Box
      sx={{
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s ease",
        padding: 2,
        borderRadius: 2,
        "&:hover": {
          transform: "scale(1.03)",
          background: "rgba(255,255,255,0.05)",
        },
      }}
      onClick={handleClick}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          marginBottom: 1.5,
          background: "linear-gradient(45deg, #2196F3, #21CBF3)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {rating}/5
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 1.5,
        }}
      >
        {[...Array(fullStars)].map((_, index) => (
          <StarIcon
            key={index}
            sx={{
              color: "#FFD700",
              fontSize: 28,
              filter: "drop-shadow(0 2px 4px rgba(255,215,0,0.3))",
            }}
          />
        ))}
        {hasHalfStar && (
          <StarIcon
            sx={{
              color: "#FFD700",
              fontSize: 28,
              opacity: 0.5,
            }}
          />
        )}
        {[...Array(emptyStars)].map((_, index) => (
          <StarBorderIcon key={index} sx={{ color: "#FFD700", fontSize: 28 }} />
        ))}
      </Box>

      <Typography
        variant="body1"
        sx={{
          color: "#e0e0e0",
          textDecoration: "underline",
          cursor: "pointer",
          fontWeight: 500,
          "&:hover": {
            color: "#2196F3",
          },
        }}
      >
        {reviewCount > 0 ? `${reviewCount} đánh giá` : "Chưa có đánh giá"}
      </Typography>
    </Box>
  );
};

RatingDisplay.propTypes = {
  rating: PropTypes.number.isRequired,
  reviewCount: PropTypes.number.isRequired,
  reviews: PropTypes.array.isRequired,
};

export default RatingDisplay;
