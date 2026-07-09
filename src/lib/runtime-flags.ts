/**
 * Local development keeps testing controls visible. Production hides them unless
 * a preview build explicitly opts in with NEXT_PUBLIC_DEV_TOOLS=1.
 */
export const DEV_TOOLS_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_DEV_TOOLS === "1";
