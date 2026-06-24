export function getOneYearAgoDate() {
  const date = new Date();

  date.setDate(date.getDate() - 365);

  return date.toISOString().split("T")[0];
}

