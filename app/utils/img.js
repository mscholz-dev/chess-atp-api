const fs = require("fs");

// delete avatar from the folder uploads
const removeAvatar = (req) => (req.files?.avatar ? fs.unlinkSync(`uploads/${req.files.avatar[0].filename}`) : null);

module.exports = {
  removeAvatar,
};
