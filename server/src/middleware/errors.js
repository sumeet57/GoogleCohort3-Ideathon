export function notFound(_req, res) {
  res.status(404).json({
    error: "Route not found."
  });
}

export function errorHandler(error, _req, res, _next) {
  console.error("[Server Error]");
  console.error("name:", error?.name);
  console.error("message:", error?.message);
  console.error("code:", error?.code);
  console.error("details:", error?.details);
  console.error("stack:", error?.stack);

  if (error?.name === "ZodError") {
    return res.status(400).json({
      error: "Invalid request.",
      details: error.issues
    });
  }

  res.status(500).json({
    error: "Internal server error.",
    details: error?.message || "Unknown server error"
  });
}