import { USE_AGENTS } from "../config/appConfig";

const BASE_URL = "http://localhost:5000";

export const getBookingEndpoint = () => {
  return USE_AGENTS
    ? `${BASE_URL}/api/agent/book`
    : `${BASE_URL}/api/book`;
};
