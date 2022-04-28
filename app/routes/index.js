const fs = require("fs");

module.exports = () => {
  const allRoutes = {};

  const files = fs.readdirSync("./app/routes");

  for (const file of files) {
    if (file.includes("Router"))
      allRoutes[file.split(".")[0]] = require(`${__dirname}/${file}`);
  }

  return Object.values(allRoutes);
};
