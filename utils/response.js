exports.response = ({ status, message, data, error }) => {
  return {
    status: status ? `${status}` : '1',
    message: message ? `${message}` : 'success',
    data: data||{},
    error: error ? `${error}` : ''
  };
};