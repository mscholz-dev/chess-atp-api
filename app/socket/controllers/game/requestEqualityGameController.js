const requestEqualityGameController = (socket) => {
  for (const room of socket.adapter.rooms) {
    // is it a game room and only one player inside and the same player
    if (room[0].indexOf("game:") !== -1 && room[1].has(socket.id)) {
      socket.to(room).emit("game:recieveEquality");
    }
  }
};

module.exports = requestEqualityGameController;
