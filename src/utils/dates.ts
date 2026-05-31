export const localDateISO = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayISO = (): string => localDateISO();

export const yesterdayISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateISO(d);
};

export const nowISO = (): string => new Date().toISOString();

export const formatDisplayDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
};
