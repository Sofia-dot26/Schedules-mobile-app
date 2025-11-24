export const formatDate = (dateString, options = {}) => {
  try {
    const date = new Date(dateString);
    const defaultOptions = {
      year: 'numeric', //полный год
      month: '2-digit', //месяц с ведущим 0
      day: '2-digit',//день с ведущим 0
      hour: '2-digit',//час с ведущим 0
      minute: '2-digit'//минуты с ведущим 0
    };

    return date.toLocaleString('ru-RU', { ...defaultOptions, ...options });
  } catch (error) {
    console.warn('Invalid date format:', dateString);
    return 'Неизвестная дата';
  }
};

export const formatDateShort = (dateString) => {
  return formatDate(dateString, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  });
};