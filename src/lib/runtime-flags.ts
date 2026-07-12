/**
 * Local development keeps testing controls visible. Production hides them unless
 * a preview build explicitly opts in with NEXT_PUBLIC_DEV_TOOLS=1.
 *
 * Demo Mode's production exception is handled at the HomePage call site because
 * it depends on live geolocation state rather than a static build-time flag.
 */
export const DEV_TOOLS_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_DEV_TOOLS === "1";
