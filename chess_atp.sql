-- phpMyAdmin SQL Dump
-- version 5.0.4deb2ubuntu5
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 28, 2022 at 03:59 PM
-- Server version: 8.0.28-0ubuntu0.21.10.3
-- PHP Version: 8.0.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chess_atp`
--

-- --------------------------------------------------------

--
-- Table structure for table `game`
--

CREATE TABLE `game` (
  `id` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  `player_one_id` bigint NOT NULL,
  `player_two_id` bigint DEFAULT NULL,
  `turn` enum('one','two') NOT NULL,
  `player_one_time_left` tinyint NOT NULL,
  `player_two_time_left` tinyint NOT NULL,
  `created_at` datetime NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `finished_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `game_castle`
--

CREATE TABLE `game_castle` (
  `id` bigint NOT NULL,
  `game_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  `name` enum('castle_left_one','castle_right_one','castle_left_two','castle_right_two') NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `game_move`
--

CREATE TABLE `game_move` (
  `id` bigint NOT NULL,
  `game_id` bigint NOT NULL,
  `player_id` bigint NOT NULL,
  `piece` varchar(255) NOT NULL,
  `prev_pos` varchar(2) NOT NULL,
  `new_pos` varchar(2) NOT NULL,
  `eating` tinyint(1) NOT NULL,
  `checking` tinyint(1) NOT NULL,
  `checkmating` tinyint(1) NOT NULL,
  `stalemating` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `game_score`
--

CREATE TABLE `game_score` (
  `id` bigint NOT NULL,
  `game_id` bigint NOT NULL,
  `score` enum('0 - 1','1 - 0','0.5 - 0.5') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `ip_address`
--

CREATE TABLE `ip_address` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `ip_address` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `ip_address`
--

INSERT INTO `ip_address` (`id`, `user_id`, `ip_address`) VALUES
(44, 1, '192.168.1.11'),
(46, 112, '192.168.1.11');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` bigint NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(60) NOT NULL,
  `role` enum('superAdmin','admin','client') NOT NULL,
  `language` enum('fr','en') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `avatar`, `username`, `email`, `password`, `role`, `language`, `created_at`, `updated_at`) VALUES
(1, 'no_exif_1650962667644.png', 'SuperAdminA', 'mscholz.dev@gmail.coma', '$2a$10$JKBOI.2pCAFKN.lui6PBOeMCWKo7lTY5zcg8N1V5klTZIh/ziA2dW', 'superAdmin', 'fr', '2022-04-26 10:44:27', '2022-04-28 15:48:02'),
(108, 'default.png', 'ezaezae', 'eazeza@eazeaz.eaz', '$2a$10$2g6J8J7vgFPFzDojgoosrey/kOwrS1yVmdio5Mfl3RX/z19UDl4kW', 'admin', 'fr', '2022-04-28 15:41:07', '2022-04-28 15:41:07'),
(109, 'default.png', 'dfsqsdqsdqsdq', 'dqsdqsd@dqsd.dqsds', '$2a$10$bImyycPCqxqzgP54.1jjguly4VTid9KSgeGGapeL80gkofRmeUmr2', 'admin', 'fr', '2022-04-28 15:42:34', '2022-04-28 15:42:34'),
(110, 'default.png', 'zezaeza', 'eazezaaz@eazea.eaz', '$2a$10$uA2jcgKUfx3Ci.cTWfJyHOxJbnwfcafDt3sN67w4.UxjP3KRHPo4O', 'admin', 'fr', '2022-04-28 15:45:04', '2022-04-28 15:45:04'),
(111, 'default.png', 'ezaeaezdsqd', 'mscholz.dev@gmail.comaaa', '$2a$10$hBMlhm5f0ndCQWcHa.f4weAAkYw4UKWXc65TTA0uE/1Vnu5eKClDC', 'admin', 'fr', '2022-04-28 15:46:38', '2022-04-28 15:46:38'),
(112, 'default.png', 'ezaezaezaezaez', 'mscholz.dev@gmail.com', '$2a$10$G/QWhp4d/5QSIHHQERq6Oe9zm14Km5XTQO/Iu4USURXhGUVjnPOGe', 'client', 'fr', '2022-04-28 15:49:28', '2022-04-28 15:58:56');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `game`
--
ALTER TABLE `game`
  ADD PRIMARY KEY (`id`),
  ADD KEY `player_one_id` (`player_one_id`),
  ADD KEY `player_two_id` (`player_two_id`);

--
-- Indexes for table `game_castle`
--
ALTER TABLE `game_castle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`),
  ADD KEY `player_id` (`player_id`);

--
-- Indexes for table `game_move`
--
ALTER TABLE `game_move`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`),
  ADD KEY `player_id` (`player_id`);

--
-- Indexes for table `game_score`
--
ALTER TABLE `game_score`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`);

--
-- Indexes for table `ip_address`
--
ALTER TABLE `ip_address`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `game`
--
ALTER TABLE `game`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT for table `game_castle`
--
ALTER TABLE `game_castle`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game_move`
--
ALTER TABLE `game_move`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `game_score`
--
ALTER TABLE `game_score`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `ip_address`
--
ALTER TABLE `ip_address`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `game`
--
ALTER TABLE `game`
  ADD CONSTRAINT `game_ibfk_1` FOREIGN KEY (`player_one_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `game_ibfk_2` FOREIGN KEY (`player_two_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `game_castle`
--
ALTER TABLE `game_castle`
  ADD CONSTRAINT `game_castle_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `game_castle_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `game_move`
--
ALTER TABLE `game_move`
  ADD CONSTRAINT `game_move_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `game_move_ibfk_3` FOREIGN KEY (`game_id`) REFERENCES `game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `game_score`
--
ALTER TABLE `game_score`
  ADD CONSTRAINT `game_score_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ip_address`
--
ALTER TABLE `ip_address`
  ADD CONSTRAINT `ip_address_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
