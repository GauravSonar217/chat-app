import dayjs from "dayjs";

export const formatDate = (date, options = {}) => {
  if (!date) return "";

  const { includeTime = false } = options;

  const formattedDate = dayjs(date).format("MMM DD, YYYY");

  if (includeTime) {
    const time = dayjs(date).format("hh:mm A");
    return `${formattedDate} at ${time}`;
  }

  return formattedDate;
};