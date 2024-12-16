/* eslint-disable node/no-unsupported-features/es-syntax */
//* For Schools
exports.school = async sch => {
  if (!sch || typeof sch !== 'object') {
    console.log('🚀 schoolFormater passing invalid parametter :', sch);
    return null; // Return null for invalid input
  }
  const { createdAt, ...obj } = sch;
  const phoneNum = obj.phoneNum ? obj.phoneNum : 'ERR';
  const id = obj.id || 'ERR';
  const regNum = `SCH-${id}-${phoneNum}`;
  // Create the 'createdOn' based on 'createdAt'
  const createdOn = createdAt
    ? new Date(createdAt).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '';

  return {
    ...obj,
    regNum: regNum,
    createdOn: createdOn
  };
};
//* For Students

exports.student = async stu => {
  if (!stu || typeof stu !== 'object') {
    console.log('🚀 studentFormater passing invalid parametter :', stu);
    return null; // Return null for invalid input
  }

  const { createdAt, ...obj } = stu;
  const rollNum = obj.rollNum ? obj.rollNum : 'ERR';
  const id = obj.id || 'ERR';
  // Create the 'regNum' based on the 'id' and 'rollNum'
  const regNum = `REG-${id}-${rollNum}`;

  const createdOn = createdAt
    ? new Date(createdAt).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '';

  return {
    ...obj,
    regNum: regNum,
    createdOn: createdOn
  };
};
