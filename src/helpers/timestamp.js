const timestamp = dateTime => {
  const padLeft = base => ('0' + base.toString()).slice(-2);
  const dateFormat = [ padLeft(dateTime.getMonth()+1), padLeft(dateTime.getDate()), dateTime.getFullYear() ].join('/');
  const timeFormat = [ padLeft(dateTime.getHours()), padLeft(dateTime.getMinutes()) ].join(':');
  
  return `${dateFormat} at ${timeFormat}`;
};

export default timestamp;
