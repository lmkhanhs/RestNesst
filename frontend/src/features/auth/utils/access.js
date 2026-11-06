export const getUserRoles = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.roles || [];
};

export const hasAccess = (requiredRole) => {
  const userRoles = getUserRoles();

  if (!userRoles.length) return false;

  // Admin có quyền truy cập tất cả
  if (userRoles.includes("ADMIN")) return true;
  // Host có quyền vào host và profile
  if (userRoles.includes("HOST") && ["host", "profile"].includes(requiredRole))
    return true;
  // User chỉ vào profile
  if (userRoles.includes("GUEST") && requiredRole === "profile") return true;

  return false;
};
