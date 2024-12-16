-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 01, 2023 at 05:00 AM
-- Server version: 5.7.44
-- PHP Version: 8.1.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `myace_shipping`
--

-- --------------------------------------------------------

--
-- Table structure for table `addressDBs`
--

CREATE TABLE `addressDBs` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `streetAddress` varchar(255) DEFAULT '',
  `building` varchar(255) DEFAULT '',
  `floor` varchar(255) DEFAULT '',
  `apartment` varchar(255) DEFAULT '',
  `district` varchar(255) DEFAULT '',
  `city` varchar(255) DEFAULT '',
  `province` varchar(255) DEFAULT '',
  `country` varchar(255) DEFAULT '',
  `postalCode` varchar(255) DEFAULT '',
  `lat` varchar(255) DEFAULT '',
  `lng` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '1',
  `type` varchar(1024) DEFAULT '',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `structureTypeId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `warehouseId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `addressDBs`
--

INSERT INTO `addressDBs` (`id`, `title`, `streetAddress`, `building`, `floor`, `apartment`, `district`, `city`, `province`, `country`, `postalCode`, `lat`, `lng`, `status`, `type`, `deleted`, `createdAt`, `updatedAt`, `structureTypeId`, `userId`, `warehouseId`) VALUES
(1, '', 'Ali Town', '', '', '', 'Lahore', 'Lahore City', 'Punjab', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-04 09:07:20', '2023-10-04 09:07:20', NULL, NULL, 4),
(2, 'Home', '174D, abcd', '1', '0', '21', 'Raiwind', 'Lahore', 'Punjab', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-04 09:14:19', '2023-10-04 09:14:19', NULL, 2, NULL),
(3, 'Comsdsdpany', '174D, abcd', '1', '0', '21', 'Raiwind', 'Lahore', 'Punjab', 'Pakistan', '53125', '1123545', '115884', 1, '', 0, '2023-10-04 09:33:28', '2023-10-04 09:33:28', NULL, 3, NULL),
(4, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:39:44', '2023-10-05 10:39:44', NULL, NULL, NULL),
(5, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:41:55', '2023-10-05 10:41:55', NULL, NULL, NULL),
(6, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:44:07', '2023-10-05 10:44:07', NULL, NULL, NULL),
(7, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:49:05', '2023-10-05 10:49:05', NULL, NULL, NULL),
(8, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:49:39', '2023-10-05 10:49:39', NULL, NULL, NULL),
(9, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:50:41', '2023-10-05 10:50:41', NULL, NULL, NULL),
(10, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:51:41', '2023-10-05 10:51:41', NULL, NULL, NULL),
(11, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:54:24', '2023-10-05 10:54:24', NULL, NULL, NULL),
(12, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:54:38', '2023-10-05 10:54:38', NULL, NULL, NULL),
(13, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:55:12', '2023-10-05 10:55:12', NULL, NULL, NULL),
(14, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:56:25', '2023-10-05 10:56:25', NULL, NULL, NULL),
(15, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 10:56:54', '2023-10-05 10:56:54', NULL, NULL, NULL),
(16, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-05 11:24:10', '2023-10-05 11:24:10', NULL, NULL, NULL),
(17, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-09 06:06:40', '2023-10-09 06:06:40', NULL, NULL, NULL),
(21, 'Home', '174D, abcd', '1', '0', '', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-09 07:38:19', '2023-10-09 07:38:19', NULL, NULL, NULL),
(36, 'Warehouse USA', '655 South Hope Street 901', '', '', ' ', ' ', 'Los Angeles', ' California', 'USA', '90017', '31.462648052400592', '74.24418715084103', 1, '', 0, '2023-10-09 07:58:19', '2023-10-17 06:18:28', NULL, NULL, NULL),
(37, 'company', 'F67W+4WQ', 'building123', 'floor2', 'apt33', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.462913867150622', '74.24770329147577', 1, '', 0, '2023-10-11 09:48:54', '2023-10-11 09:48:54', NULL, NULL, NULL),
(38, 'cjvjvj', 'F67R+6RF', 'chhch', 'fhchcj', 'jvjcj', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.463140651571436', '74.24212966114283', 1, '', 0, '2023-10-11 11:42:05', '2023-10-11 11:42:05', NULL, NULL, NULL),
(39, 'ali town', 'F67R+PG3', 'abc', '2', '1', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-12 10:23:36', '2023-10-12 10:23:36', NULL, NULL, NULL),
(40, 'Thokar', 'F67R+PG3', '1', '1', '1', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-12 10:25:55', '2023-10-12 10:25:55', NULL, NULL, NULL),
(42, 'Warehouse Puerto Rico', '560 Juan J Jimenez street', '', '', '', ' ', 'San Juan', 'Puerto Rico', 'USA', '00918', '33.69202439969642', '73.04901590145333', 1, '', 0, '2023-10-13 10:55:51', '2023-10-13 10:55:51', NULL, NULL, NULL),
(46, 'Home', '174D, abcd', '1', '0', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-13 12:32:54', '2023-10-13 12:32:54', NULL, NULL, NULL),
(50, 'home', 'F67R+PG3', '123', '5', '45', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-13 13:14:17', '2023-10-13 13:14:17', NULL, 12, NULL),
(51, 'home', 'F67R+PG3', '123', '5', '45', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '568732', '31.4643687', '74.2414678', 1, '', 0, '2023-10-13 13:14:41', '2023-10-13 13:14:41', NULL, 12, NULL),
(52, 'home', 'Plot 123', 'building 12', '09', 'apt32', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465549737410086', '74.24550991505384', 1, '', 0, '2023-10-16 10:18:16', '2023-10-16 10:18:16', NULL, NULL, NULL),
(53, 'home', 'Plot 123', 'building 12', '09', 'apt32', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465549737410086', '74.24550991505384', 1, '', 0, '2023-10-16 10:20:16', '2023-10-16 10:20:16', NULL, NULL, NULL),
(54, 'home', 'Plot 123', 'building 12', '09', 'apt32', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465549737410086', '74.24550991505384', 1, '', 0, '2023-10-16 10:20:56', '2023-10-16 10:20:56', NULL, NULL, NULL),
(55, 'home', 'Plot 123', 'building 12', '09', 'apt32', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465549737410086', '74.24550991505384', 1, '', 0, '2023-10-16 10:21:13', '2023-10-16 10:21:13', NULL, NULL, NULL),
(56, 'home', 'Plot 123', 'building 12', '09', 'apt32', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465549737410086', '74.24550991505384', 1, '', 0, '2023-10-16 10:28:34', '2023-10-16 10:28:34', NULL, NULL, NULL),
(57, 'home', 'Plot 123', 'building 12', '09', 'apt32', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465549737410086', '74.24550991505384', 1, '', 0, '2023-10-16 10:28:39', '2023-10-16 10:28:39', NULL, NULL, NULL),
(58, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-16 10:39:27', '2023-10-16 10:39:27', NULL, NULL, NULL),
(59, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-16 10:39:45', '2023-10-16 10:39:45', NULL, NULL, NULL),
(60, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-16 10:40:15', '2023-10-16 10:40:15', NULL, NULL, NULL),
(61, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-16 10:42:07', '2023-10-16 10:42:07', NULL, NULL, NULL),
(62, 'home', 'Plot 123', 'building 12', '09', 'apt32', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465549737410086', '74.24550991505384', 1, '', 0, '2023-10-16 11:24:55', '2023-10-16 11:24:55', NULL, NULL, NULL),
(63, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-16 12:02:10', '2023-10-16 12:02:10', NULL, NULL, NULL),
(64, 'office', '78 Raiwind Rd', '12', '56', '78', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.460882792276454', '74.24121301621199', 1, '', 0, '2023-10-16 12:02:39', '2023-10-16 12:02:39', NULL, NULL, NULL),
(65, '', '', '', '', '', '', '', '', '', '', '31.460882792', '74.0000', 1, '', 0, '2023-10-17 06:02:10', '2023-10-17 06:02:10', NULL, NULL, 10),
(66, '', 'a', '', '', '', 'a', 'a', 'a', 'a', '', '31.46434235', '74.0000567567', 1, '', 0, '2023-10-17 06:11:46', '2023-10-17 06:11:46', NULL, NULL, NULL),
(67, '', 'a', '', '', '', 'a', 'a', 'a', 'a', '', '31.4608827922754256873', '74.00005454', 1, '', 0, '2023-10-17 06:11:55', '2023-10-17 06:11:55', NULL, NULL, 12),
(68, 'home', '2 Raiwind Rd', 'a', 'a', 'a', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '54000', '31.464384095354642', '74.24350731074811', 1, '', 0, '2023-10-17 10:16:22', '2023-10-17 10:16:22', NULL, NULL, NULL),
(69, 'ali town', 'F67R+MXV', 'a', 'a', 'a', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.464195635180612', '74.24246728420256', 1, '', 0, '2023-10-18 07:23:52', '2023-10-18 07:23:52', NULL, 47, NULL),
(70, 'cjvkvjvjvjcjfjc', '8', '23', 'jf', 'vhh', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.457045879537766', '74.24428548663855', 1, '', 0, '2023-10-18 07:54:12', '2023-10-18 07:54:12', NULL, 32, NULL),
(71, 'comsats', 'Researchers Rd', 'a', 'a', 'a', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.402718519663924', '74.2126340791583', 1, '', 0, '2023-10-18 12:01:55', '2023-10-18 12:01:55', NULL, 47, NULL),
(72, 'comsats', 'Researchers Rd', '1', '1', '1', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.402718519663924', '74.2126340791583', 1, '', 0, '2023-10-18 12:02:33', '2023-10-18 12:02:33', NULL, 47, NULL),
(73, 'uol', 's', '2', '2', '2', 'Lahore', '', '', '', '', '', '', 1, '', 0, '2023-10-18 12:03:50', '2023-10-18 12:03:50', NULL, 47, NULL),
(74, 'uol', '1', '1', '1', '1', 'Lahore', '', '', '', '', '', '', 1, '', 0, '2023-10-18 12:04:43', '2023-10-18 12:04:43', NULL, 47, NULL),
(75, 'comsats', 'Researchers Rd', '1', '1', '1', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.402718519663924', '74.2126340791583', 1, '', 0, '2023-10-18 12:05:14', '2023-10-18 12:05:14', NULL, 47, NULL),
(76, 'office', 'F67R+PG3', '12', '5th floor', 'number', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-20 10:48:10', '2023-10-20 10:48:10', NULL, NULL, NULL),
(77, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-24 09:32:08', '2023-10-24 09:32:08', NULL, NULL, NULL),
(78, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-24 09:32:11', '2023-10-24 09:32:11', NULL, NULL, NULL),
(79, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-24 09:33:06', '2023-10-24 09:33:06', NULL, NULL, NULL),
(80, 'office', '267 Dundas St', '123', '2', '5', 'Middlesex County', 'London', 'ON', 'Canada', 'N6A 1H2', '42.98433935565513', '-81.24560538679361', 1, '', 0, '2023-10-24 09:35:59', '2023-10-24 09:35:59', NULL, NULL, NULL),
(81, 'office', '267 Dundas St', '123', '2', '5', 'Middlesex County', 'London', 'ON', 'Canada', 'N6A 1H2', '42.98433935565513', '-81.24560538679361', 1, '', 0, '2023-10-24 09:38:41', '2023-10-24 09:38:41', NULL, NULL, NULL),
(82, 'office', '267 Dundas St', '123', '2', '5', 'Middlesex County', 'London', 'ON', 'Canada', 'N6A 1H2', '42.98433935565513', '-81.24560538679361', 1, '', 0, '2023-10-24 09:39:55', '2023-10-24 09:39:55', NULL, NULL, NULL),
(83, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-24 09:44:22', '2023-10-24 09:44:22', NULL, NULL, NULL),
(84, 'office', '267 Dundas St', '123', '2', '5', 'Middlesex County', 'London', 'ON', 'Canada', 'N6A 1H2', '42.98433935565513', '-81.24560538679361', 1, '', 0, '2023-10-24 09:58:05', '2023-10-24 09:58:05', NULL, NULL, NULL),
(85, 'office', '267 Dundas St', '123', '2', '5', 'Middlesex County', 'London', 'ON', 'Canada', 'N6A 1H2', '42.98433935565513', '-81.24560538679361', 1, '', 0, '2023-10-24 11:13:26', '2023-10-24 11:13:26', NULL, NULL, NULL),
(86, 'office', '267 Dundas St', '123', '2', '5', 'Middlesex County', 'London', 'ON', 'Canada', 'N6A 1H2', '42.98433935565513', '-81.24560538679361', 1, '', 0, '2023-10-24 11:34:40', '2023-10-24 11:34:40', NULL, NULL, NULL),
(87, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 11:51:49', '2023-10-24 11:51:49', NULL, NULL, NULL),
(88, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 11:52:13', '2023-10-24 11:52:13', NULL, NULL, NULL),
(89, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 11:53:36', '2023-10-24 11:53:36', NULL, NULL, NULL),
(90, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 11:54:35', '2023-10-24 11:54:35', NULL, NULL, NULL),
(91, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 12:03:18', '2023-10-24 12:03:18', NULL, NULL, NULL),
(92, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 12:08:15', '2023-10-24 12:08:15', NULL, NULL, NULL),
(93, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:01:43', '2023-10-24 13:01:43', NULL, NULL, NULL),
(94, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:01:45', '2023-10-24 13:01:45', NULL, NULL, NULL),
(95, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:01:47', '2023-10-24 13:01:47', NULL, NULL, NULL),
(96, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:01:47', '2023-10-24 13:01:47', NULL, NULL, NULL),
(97, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:02:05', '2023-10-24 13:02:05', NULL, NULL, NULL),
(98, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:02:15', '2023-10-24 13:02:15', NULL, NULL, NULL),
(99, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:02:25', '2023-10-24 13:02:25', NULL, NULL, NULL),
(100, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:02:33', '2023-10-24 13:02:33', NULL, NULL, NULL),
(101, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:07:46', '2023-10-24 13:07:46', NULL, NULL, NULL),
(102, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:07:55', '2023-10-24 13:07:55', NULL, NULL, NULL),
(103, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:08:07', '2023-10-24 13:08:07', NULL, NULL, NULL),
(104, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:08:23', '2023-10-24 13:08:23', NULL, NULL, NULL),
(105, 'gggg', '13 Raiwind Rd', '1234', 'fff', 'fv', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465851440729978', '74.24164619296789', 1, '', 0, '2023-10-24 13:08:58', '2023-10-24 13:08:58', NULL, NULL, NULL),
(106, 'gggg', '13 Raiwind Rd', '1234', 'fff', 'fv', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465851440729978', '74.24164619296789', 1, '', 0, '2023-10-24 13:14:31', '2023-10-24 13:14:31', NULL, NULL, NULL),
(107, 'gggg', '13 Raiwind Rd', '1234', 'fff', 'fv', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.465851440729978', '74.24164619296789', 1, '', 0, '2023-10-24 13:15:07', '2023-10-24 13:15:07', NULL, NULL, NULL),
(108, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:24:06', '2023-10-24 13:24:06', NULL, NULL, NULL),
(109, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-24 13:24:19', '2023-10-24 13:24:19', NULL, NULL, NULL),
(110, 'home', 'F68Q+HR5', '123', '1', '4', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.46637420019957', '74.23931702971458', 1, '', 0, '2023-10-25 05:08:18', '2023-10-25 05:08:18', NULL, NULL, NULL),
(111, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:09:06', '2023-10-25 05:09:06', NULL, NULL, NULL),
(112, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:09:12', '2023-10-25 05:09:12', NULL, NULL, NULL),
(113, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:09:56', '2023-10-25 05:09:56', NULL, NULL, NULL),
(114, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:16:17', '2023-10-25 05:16:17', NULL, NULL, NULL),
(115, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:19:58', '2023-10-25 05:19:58', NULL, NULL, NULL),
(116, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:21:05', '2023-10-25 05:21:05', NULL, NULL, NULL),
(117, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:24:44', '2023-10-25 05:24:44', NULL, NULL, NULL),
(118, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:30:04', '2023-10-25 05:30:04', NULL, NULL, NULL),
(119, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 05:38:39', '2023-10-25 05:38:39', NULL, NULL, NULL),
(120, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 06:12:40', '2023-10-25 06:12:40', NULL, NULL, NULL),
(121, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 06:13:15', '2023-10-25 06:13:15', NULL, NULL, NULL),
(122, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 06:14:57', '2023-10-25 06:14:57', NULL, NULL, NULL),
(123, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 06:28:47', '2023-10-25 06:28:47', NULL, NULL, NULL),
(124, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-25 06:30:14', '2023-10-25 06:30:14', NULL, NULL, NULL),
(125, 'home', 'F67R+PG3', '1234', '2', '3', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-25 07:56:30', '2023-10-25 07:56:30', NULL, NULL, NULL),
(126, '', '', '', '', '', '', '', '', '', '', '', '', 1, '', 0, '2023-10-26 10:14:12', '2023-10-26 10:14:12', NULL, NULL, NULL),
(127, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-26 10:14:35', '2023-10-26 10:14:35', NULL, NULL, NULL),
(128, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-26 10:15:15', '2023-10-26 10:15:15', NULL, NULL, NULL),
(129, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-26 10:17:29', '2023-10-26 10:17:29', NULL, NULL, NULL),
(130, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-26 10:17:39', '2023-10-26 10:17:39', NULL, NULL, NULL),
(131, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-26 10:17:58', '2023-10-26 10:17:58', NULL, NULL, NULL),
(132, 'hhshshshshsh', 'Plot 27', 'hshdhsbbe', 'vs', 'gsg', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.468740308031766', '74.2431616410613', 1, '', 0, '2023-10-26 10:19:56', '2023-10-26 10:19:56', NULL, 63, NULL),
(133, 'hehshhhhh', '41', 'hhh', 'h', 'bb', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.469761199034302', '74.2445332556963', 1, '', 0, '2023-10-26 10:21:08', '2023-10-26 10:21:08', NULL, NULL, NULL),
(134, 'hhssh', '41', 'hhh', 'h', 'bb', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.469761199034302', '74.2445332556963', 1, '', 0, '2023-10-26 10:21:48', '2023-10-26 10:21:48', NULL, NULL, NULL),
(135, 'hdhdhhe', '41', 'hhh', 'h', 'bb', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.469761199034302', '74.2445332556963', 1, '', 0, '2023-10-26 10:22:34', '2023-10-26 10:22:34', NULL, NULL, NULL),
(136, 'tgtvvr', 'F67R+PG3', 'tvtv', 'vtvt', 'byby', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-26 10:37:31', '2023-10-26 10:37:31', NULL, NULL, NULL),
(137, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-26 10:37:37', '2023-10-26 10:37:37', NULL, NULL, NULL),
(138, 'fjjgjv', 'Plot 126', 'dgf', 'gjjgjf', 'fjjfbx', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.46550398137145', '74.2459350451827', 1, '', 0, '2023-10-26 11:59:53', '2023-10-26 11:59:53', NULL, NULL, NULL),
(139, 'alitown', '140', '123', '1', '1', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.46248832314855', '74.24654424190521', 1, '', 0, '2023-10-26 12:23:26', '2023-10-26 12:23:26', NULL, NULL, NULL),
(140, 'alitown', '140', '123', '1', '1', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.46248832314855', '74.24654424190521', 1, '', 0, '2023-10-26 12:48:19', '2023-10-26 12:48:19', NULL, NULL, NULL),
(141, 'alitown', '140', '123', '1', '1', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.46248832314855', '74.24654424190521', 1, '', 0, '2023-10-26 13:00:13', '2023-10-26 13:00:13', NULL, NULL, NULL),
(142, 'homr', '2 Raiwind Rd', 'hwhwhw', '1', 'gwg', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '54000', '31.464466171214756', '74.2435160279274', 1, '', 0, '2023-10-26 13:38:33', '2023-10-26 13:38:33', NULL, NULL, NULL),
(143, 'homr', '2 Raiwind Rd', 'hwhwhw', '1', 'gwg', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '54000', '31.464466171214756', '74.2435160279274', 1, '', 0, '2023-10-26 13:39:49', '2023-10-26 13:39:49', NULL, NULL, NULL),
(144, 'homr', '2 Raiwind Rd', 'hwhwhw', '1', 'gwg', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '54000', '31.464466171214756', '74.2435160279274', 1, '', 0, '2023-10-26 13:53:50', '2023-10-26 13:53:50', NULL, NULL, NULL),
(145, 'homr', '2 Raiwind Rd', 'hwhwhw', '1', 'gwg', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '54000', '31.464466171214756', '74.2435160279274', 1, '', 0, '2023-10-26 13:54:54', '2023-10-26 13:54:54', NULL, NULL, NULL),
(146, 'ggdvdh', 'F67R+PG3', 'hehe', 'gege', 'tvvr', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-27 06:33:23', '2023-10-27 06:33:23', NULL, NULL, NULL),
(147, 'fyf6f', 'F67R+PG3', 'hehe', 'gege', 'tvvr', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-27 06:38:40', '2023-10-27 06:38:40', NULL, NULL, NULL),
(148, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-27 06:44:22', '2023-10-27 06:44:22', NULL, NULL, NULL),
(149, 'gegeg', 'F67R+PG3', 'ggtg', 'grgr', 'vgtg', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-27 07:44:46', '2023-10-27 07:44:46', NULL, NULL, NULL),
(150, 'gegeg', 'F67R+PG3', 'ggtg', 'grgr', 'vgtg', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-27 07:45:13', '2023-10-27 07:45:13', NULL, NULL, NULL),
(151, 'fufuf7', 'F67R+PG3', 'dyr6', 'ztd', 'xyf', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.4643687', '74.2414678', 1, '', 0, '2023-10-27 07:47:53', '2023-10-27 07:47:53', NULL, NULL, NULL),
(152, 'hxhdu', '2 Raiwind Rd', 'ufi', 'dy', 'cj', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '54000', '31.46445158631108', '74.24351301044226', 1, '', 0, '2023-10-27 08:40:45', '2023-10-27 08:40:45', NULL, NULL, NULL),
(153, 'Home', '174D, abcd', '1', '1', '5', 'Raiwind', 'Lahore', '', 'Pakistan', '53125', '31.01256', '74.0000', 1, '', 0, '2023-10-27 10:01:15', '2023-10-27 10:01:15', NULL, NULL, NULL),
(154, 'xxx', 'Islamabad International Airport', 'ff', 'ff', 'hh', 'Rawalpindi', 'Islamabad', 'Punjab', 'Pakistan', '', '33.556490541537464', '72.83406212925911', 1, '', 0, '2023-10-27 11:06:18', '2023-10-27 11:06:18', NULL, NULL, NULL),
(155, 'shshshsh', 'HR4M+PCG Boarding Lounge Islamabad International', 'ff', 'ff', 'hh', 'Attock', 'Islamabad', 'Punjab', 'Pakistan', '', '33.5572700624081', '72.83356323838234', 1, '', 0, '2023-10-27 11:20:47', '2023-10-27 11:20:47', NULL, NULL, NULL),
(156, 'chfud', 'HR5M+7HR', 'ff', 'ff', 'hh', 'Attock', 'Islamabad', 'Punjab', 'Pakistan', '', '33.55879890871883', '72.83348243683577', 1, '', 0, '2023-10-27 11:41:01', '2023-10-27 11:41:01', NULL, NULL, NULL),
(157, 'Testing area', 'F65X+X4V', '1', '2', '3', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.460151514459415', '74.24801107496023', 1, '', 0, '2023-10-31 09:37:47', '2023-10-31 09:37:47', NULL, 47, NULL),
(158, 'testing 2', 'F65X+X4V', '11', '22', '33', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.460151514459415', '74.24801107496023', 1, '', 0, '2023-10-31 09:38:32', '2023-10-31 09:38:32', NULL, 47, NULL),
(159, 'office', 'Plot 169', 'givjvj', 'gugjvjvgj', 'vuyvhvvhvu', 'Lahore', 'Lahore', 'Punjab', 'Pakistan', '', '31.451468405178755', '74.24804091453552', 1, '', 0, '2023-10-31 09:56:14', '2023-10-31 09:56:14', NULL, 47, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `appUnits`
--

CREATE TABLE `appUnits` (
  `id` int(11) NOT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `weightUnitId` int(11) DEFAULT NULL,
  `lengthUnitId` int(11) DEFAULT NULL,
  `distanceUnitId` int(11) DEFAULT NULL,
  `currencyUnitId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `appUnits`
--

INSERT INTO `appUnits` (`id`, `status`, `deleted`, `createdAt`, `updatedAt`, `weightUnitId`, `lengthUnitId`, `distanceUnitId`, `currencyUnitId`) VALUES
(1, 1, 0, '2023-09-22 12:59:43', '2023-10-12 10:47:23', 2, 1, 3, 4);

-- --------------------------------------------------------

--
-- Table structure for table `banks`
--

CREATE TABLE `banks` (
  `id` int(11) NOT NULL,
  `bankName` varchar(255) DEFAULT NULL,
  `accountName` varchar(255) DEFAULT NULL,
  `accountNumber` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT 'Banner',
  `description` varchar(255) DEFAULT '',
  `image` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `description`, `image`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Banner', 'Test Banner', 'Public/Banners/bannerImage-1697201808032.jpg', 1, '2023-10-04 11:13:06', '2023-10-31 07:39:27'),
(2, 'Banner', 'Shipping Calculator', 'public/ShippingCalculator.png', 1, '2023-10-04 11:13:06', '2023-10-31 05:16:08'),
(3, 'Banner', 'one package', 'public/singlePackage.png', 0, '2023-10-04 11:13:06', '2023-10-13 12:48:38'),
(4, 'Banner', 'Multiple Packages', 'public/multiplePackages.png', 1, '2023-10-04 11:13:06', '2023-10-04 11:13:06'),
(5, 'Banner', 'Consolidation', 'Public/Banners/bannerImage-1697201308255.jpg', 1, '2023-10-04 11:13:06', '2023-10-30 13:17:05'),
(6, 'Banner', 'Banner 2.0', 'Public/Banners/bannerImage-1698672220960.jpg', 1, '2023-10-13 12:46:05', '2023-10-30 13:23:43'),
(7, 'Banner', 'Test', 'Public/Banners/bannerImage-1698729401393.jpg', 1, '2023-10-30 11:59:42', '2023-10-31 05:16:43'),
(8, 'Banner', 'testing', 'Public/Banners/bannerImage-1698667248887.jpg', 0, '2023-10-30 12:00:50', '2023-10-30 12:43:57');

-- --------------------------------------------------------

--
-- Table structure for table `baseUnits`
--

CREATE TABLE `baseUnits` (
  `id` int(11) NOT NULL,
  `status` tinyint(1) DEFAULT '1',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `weightUnitId` int(11) DEFAULT NULL,
  `lengthUnitId` int(11) DEFAULT NULL,
  `distanceUnitId` int(11) DEFAULT NULL,
  `currencyUnitId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `baseUnits`
--

INSERT INTO `baseUnits` (`id`, `status`, `deleted`, `createdAt`, `updatedAt`, `weightUnitId`, `lengthUnitId`, `distanceUnitId`, `currencyUnitId`) VALUES
(1, 1, 0, '2023-09-26 07:41:02', '2023-09-26 07:41:02', 2, 1, 3, 4);

-- --------------------------------------------------------

--
-- Table structure for table `billingDetails`
--

CREATE TABLE `billingDetails` (
  `id` int(11) NOT NULL,
  `subTotal` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `distanceCharge` decimal(10,2) DEFAULT NULL,
  `weightCharge` decimal(10,2) DEFAULT NULL,
  `categoryCharge` decimal(10,2) DEFAULT NULL,
  `shipmentTypeCharge` decimal(10,2) DEFAULT NULL,
  `packingCharge` decimal(10,2) DEFAULT NULL,
  `serviceCharge` decimal(10,2) DEFAULT NULL,
  `gstCharge` decimal(10,2) DEFAULT NULL,
  `adminEarning` decimal(10,2) DEFAULT NULL,
  `pickupDriverEarning` decimal(10,2) DEFAULT NULL,
  `deliveryDriverEarning` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `bookingId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `billingDetails`
--

INSERT INTO `billingDetails` (`id`, `subTotal`, `discount`, `total`, `distanceCharge`, `weightCharge`, `categoryCharge`, `shipmentTypeCharge`, `packingCharge`, `serviceCharge`, `gstCharge`, `adminEarning`, `pickupDriverEarning`, `deliveryDriverEarning`, `createdAt`, `updatedAt`, `bookingId`) VALUES
(1, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-04 09:09:30', '2023-10-04 09:09:30', NULL),
(2, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 05:31:25', '2023-10-05 05:31:25', NULL),
(3, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 05:31:56', '2023-10-05 05:31:56', NULL),
(4, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 06:14:45', '2023-10-05 06:14:45', NULL),
(5, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 06:14:51', '2023-10-05 06:14:51', NULL),
(6, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 06:14:54', '2023-10-05 06:14:54', NULL),
(7, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 06:14:59', '2023-10-05 06:14:59', NULL),
(8, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 07:48:41', '2023-10-05 07:48:41', NULL),
(9, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-05 07:49:34', '2023-10-05 07:49:34', NULL),
(10, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-13 05:50:40', '2023-10-13 05:50:40', NULL),
(11, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-13 13:07:09', '2023-10-13 13:07:09', NULL),
(12, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-17 12:23:46', '2023-10-17 12:23:46', NULL),
(13, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-17 12:24:01', '2023-10-17 12:24:01', NULL),
(14, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-17 12:24:10', '2023-10-17 12:24:10', NULL),
(15, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 05:38:46', '2023-10-18 05:38:46', NULL),
(16, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 05:38:50', '2023-10-18 05:38:50', NULL),
(17, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 05:38:53', '2023-10-18 05:38:53', NULL),
(18, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 05:40:00', '2023-10-18 05:40:00', NULL),
(19, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 05:40:09', '2023-10-18 05:40:09', NULL),
(20, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 05:41:04', '2023-10-18 05:41:04', NULL),
(21, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 05:41:20', '2023-10-18 05:41:20', NULL),
(22, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 07:23:13', '2023-10-18 07:23:13', NULL),
(23, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-18 07:24:08', '2023-10-18 07:24:08', NULL),
(24, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 06:35:46', '2023-10-20 06:35:46', NULL),
(25, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 07:17:38', '2023-10-20 07:17:38', NULL),
(26, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 07:36:01', '2023-10-20 07:36:01', NULL),
(27, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 10:26:25', '2023-10-20 10:26:25', NULL),
(28, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 10:26:39', '2023-10-20 10:26:39', NULL),
(29, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 10:26:43', '2023-10-20 10:26:43', NULL),
(30, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 10:26:54', '2023-10-20 10:26:54', NULL),
(31, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 10:26:58', '2023-10-20 10:26:58', NULL),
(32, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 10:27:15', '2023-10-20 10:27:15', NULL),
(33, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, 32.00, '2023-10-20 11:46:43', '2023-10-26 09:49:58', NULL),
(34, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, 16.00, '2023-10-20 11:49:28', '2023-10-26 09:50:12', NULL),
(35, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:22', '2023-10-20 11:52:22', NULL),
(36, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:23', '2023-10-20 11:52:23', NULL),
(37, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:27', '2023-10-20 11:52:27', NULL),
(38, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, 16.00, '2023-10-20 11:52:29', '2023-10-31 07:21:05', NULL),
(39, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:31', '2023-10-20 11:52:31', NULL),
(40, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:32', '2023-10-20 11:52:32', NULL),
(41, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:34', '2023-10-20 11:52:34', NULL),
(42, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, 16.00, '2023-10-20 11:52:35', '2023-10-31 08:01:09', NULL),
(43, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:36', '2023-10-20 11:52:36', NULL),
(44, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-20 11:52:38', '2023-10-20 11:52:38', NULL),
(45, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-23 09:22:10', '2023-10-23 09:22:10', NULL),
(46, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-23 12:19:46', '2023-10-23 12:19:46', NULL),
(47, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-23 12:19:59', '2023-10-23 12:19:59', NULL),
(48, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-23 12:20:03', '2023-10-23 12:20:03', NULL),
(49, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-26 13:04:51', '2023-10-26 13:04:51', NULL),
(50, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, 32.00, '2023-10-26 13:05:01', '2023-10-27 06:16:24', NULL),
(51, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-31 07:22:33', '2023-10-31 07:22:33', NULL),
(52, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-31 07:24:16', '2023-10-31 07:24:16', NULL),
(53, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-31 07:24:44', '2023-10-31 07:24:44', NULL),
(54, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-31 07:25:45', '2023-10-31 07:25:45', NULL),
(55, 1584.96, 5.00, 20.00, 200.00, 100.00, 48.00, NULL, 60.00, 100.00, 1076.96, NULL, NULL, NULL, '2023-10-31 07:26:22', '2023-10-31 07:26:22', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `bookingHistories`
--

CREATE TABLE `bookingHistories` (
  `id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT '09:00:00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `bookingId` int(11) DEFAULT NULL,
  `bookingStatusId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `bookingHistories`
--

INSERT INTO `bookingHistories` (`id`, `date`, `time`, `createdAt`, `updatedAt`, `bookingId`, `bookingStatusId`) VALUES
(3, '2023-10-04', '14:09:30', '2023-10-04 09:09:30', '2023-10-04 09:09:30', NULL, 7),
(4, '2023-10-04', '14:09:30', '2023-10-04 09:09:30', '2023-10-04 09:09:30', NULL, 8),
(5, '2023-10-04', '14:10:41', '2023-10-04 09:10:41', '2023-10-04 09:10:41', NULL, 7),
(10, '2023-10-05', '10:31:25', '2023-10-05 05:31:25', '2023-10-05 05:31:25', NULL, 7),
(11, '2023-10-05', '10:31:25', '2023-10-05 05:31:25', '2023-10-05 05:31:25', NULL, 8),
(12, '2023-10-05', '10:31:56', '2023-10-05 05:31:56', '2023-10-05 05:31:56', NULL, 7),
(13, '2023-10-05', '10:31:56', '2023-10-05 05:31:56', '2023-10-05 05:31:56', NULL, 8),
(14, '2023-10-05', '11:04:36', '2023-10-05 06:04:36', '2023-10-05 06:04:36', NULL, 1),
(15, '2023-10-05', '11:06:14', '2023-10-05 06:06:14', '2023-10-05 06:06:14', NULL, 1),
(17, '2023-10-05', '11:11:42', '2023-10-05 06:11:42', '2023-10-05 06:11:42', NULL, 1),
(18, '2023-10-05', '11:14:45', '2023-10-05 06:14:45', '2023-10-05 06:14:45', NULL, 7),
(19, '2023-10-05', '11:14:45', '2023-10-05 06:14:45', '2023-10-05 06:14:45', NULL, 8),
(20, '2023-10-05', '11:14:51', '2023-10-05 06:14:51', '2023-10-05 06:14:51', NULL, 7),
(21, '2023-10-05', '11:14:51', '2023-10-05 06:14:51', '2023-10-05 06:14:51', NULL, 8),
(22, '2023-10-05', '11:14:54', '2023-10-05 06:14:54', '2023-10-05 06:14:54', NULL, 7),
(23, '2023-10-05', '11:14:54', '2023-10-05 06:14:54', '2023-10-05 06:14:54', NULL, 8),
(24, '2023-10-05', '11:14:59', '2023-10-05 06:14:59', '2023-10-05 06:14:59', NULL, 7),
(25, '2023-10-05', '11:14:59', '2023-10-05 06:14:59', '2023-10-05 06:14:59', NULL, 8),
(26, '2023-10-05', '11:41:09', '2023-10-05 06:41:09', '2023-10-05 06:41:09', NULL, 1),
(27, '2023-10-05', '11:42:32', '2023-10-05 06:42:32', '2023-10-05 06:42:32', NULL, 1),
(28, '2023-10-05', '11:46:24', '2023-10-05 06:46:24', '2023-10-05 06:46:24', NULL, 1),
(32, '2023-10-05', '11:58:20', '2023-10-05 06:58:20', '2023-10-05 06:58:20', NULL, 1),
(33, '2023-10-05', '12:02:44', '2023-10-05 07:02:44', '2023-10-05 07:02:44', NULL, 1),
(34, '2023-10-05', '12:10:40', '2023-10-05 07:10:40', '2023-10-05 07:10:40', NULL, 1),
(35, '2023-10-05', '12:10:59', '2023-10-05 07:10:59', '2023-10-05 07:10:59', NULL, 1),
(36, '2023-10-05', '12:12:54', '2023-10-05 07:12:54', '2023-10-05 07:12:54', NULL, 1),
(37, '2023-10-05', '12:13:37', '2023-10-05 07:13:37', '2023-10-05 07:13:37', NULL, 1),
(38, '2023-10-05', '12:18:38', '2023-10-05 07:18:38', '2023-10-05 07:18:38', NULL, 1),
(39, '2023-10-05', '12:18:56', '2023-10-05 07:18:56', '2023-10-05 07:18:56', NULL, 1),
(40, '2023-10-05', '12:48:41', '2023-10-05 07:48:41', '2023-10-05 07:48:41', NULL, 7),
(41, '2023-10-05', '12:48:41', '2023-10-05 07:48:41', '2023-10-05 07:48:41', NULL, 8),
(42, '2023-10-05', '12:49:34', '2023-10-05 07:49:34', '2023-10-05 07:49:34', NULL, 7),
(43, '2023-10-05', '12:49:34', '2023-10-05 07:49:34', '2023-10-05 07:49:34', NULL, 8),
(44, '2023-10-05', '14:51:56', '2023-10-05 09:51:56', '2023-10-05 09:51:56', NULL, 1),
(45, '2023-10-05', '14:53:36', '2023-10-05 09:53:36', '2023-10-05 09:53:36', NULL, 1),
(46, '2023-10-05', '15:22:06', '2023-10-05 10:22:06', '2023-10-05 10:22:06', NULL, 1),
(47, '2023-10-05', '15:29:17', '2023-10-05 10:29:17', '2023-10-05 10:29:17', NULL, 1),
(48, '2023-10-05', '15:35:54', '2023-10-05 10:35:54', '2023-10-05 10:35:54', NULL, 1),
(51, '2023-10-05', '17:14:50', '2023-10-05 12:14:50', '2023-10-05 12:14:50', NULL, 1),
(52, '2023-10-11', '14:17:17', '2023-10-11 09:17:17', '2023-10-11 09:17:17', NULL, 1),
(53, '2023-10-11', '16:43:18', '2023-10-11 11:43:18', '2023-10-11 11:43:18', NULL, 1),
(54, '2023-10-11', '16:45:39', '2023-10-11 11:45:39', '2023-10-11 11:45:39', NULL, 1),
(55, '2023-10-11', '16:51:42', '2023-10-11 11:51:42', '2023-10-11 11:51:42', NULL, 1),
(56, '2023-10-11', '16:56:47', '2023-10-11 11:56:47', '2023-10-11 11:56:47', NULL, 1),
(57, '2023-10-12', '10:30:53', '2023-10-12 05:30:53', '2023-10-12 05:30:53', NULL, 1),
(58, '2023-10-12', '11:21:17', '2023-10-12 06:21:17', '2023-10-12 06:21:17', NULL, 1),
(59, '2023-10-12', '12:10:43', '2023-10-12 07:10:43', '2023-10-12 07:10:43', NULL, 1),
(60, '2023-10-12', '12:36:03', '2023-10-12 07:36:03', '2023-10-12 07:36:03', NULL, 1),
(61, '2023-10-12', '14:10:49', '2023-10-12 09:10:49', '2023-10-12 09:10:49', NULL, 1),
(62, '2023-10-12', '14:11:35', '2023-10-12 09:11:35', '2023-10-12 09:11:35', NULL, 1),
(63, '2023-10-12', '14:12:03', '2023-10-12 09:12:03', '2023-10-12 09:12:03', NULL, 1),
(64, '2023-10-12', '14:29:20', '2023-10-12 09:29:20', '2023-10-12 09:29:20', NULL, 1),
(65, '2023-10-12', '14:31:20', '2023-10-12 09:31:20', '2023-10-12 09:31:20', NULL, 1),
(66, '2023-10-12', '18:14:09', '2023-10-12 13:14:09', '2023-10-12 13:14:09', NULL, 7),
(67, '2023-10-13', '10:14:46', '2023-10-13 05:14:46', '2023-10-13 05:14:46', NULL, 7),
(68, '2023-10-13', '10:36:43', '2023-10-13 05:36:43', '2023-10-13 05:36:43', NULL, 1),
(69, '2023-10-13', '10:36:43', '2023-10-13 05:36:43', '2023-10-13 05:36:43', NULL, 1),
(70, '2023-10-13', '10:39:10', '2023-10-13 05:39:10', '2023-10-13 05:39:10', NULL, 1),
(71, '2023-10-13', '10:44:04', '2023-10-13 05:44:05', '2023-10-13 05:44:05', NULL, 1),
(72, '2023-10-13', '10:50:40', '2023-10-13 05:50:40', '2023-10-13 05:50:40', NULL, 7),
(73, '2023-10-13', '10:50:40', '2023-10-13 05:50:40', '2023-10-13 05:50:40', NULL, 8),
(74, '2023-10-13', '10:50:40', '2023-10-13 05:50:40', '2023-10-13 05:50:40', NULL, 10),
(75, '2023-10-13', '11:02:03', '2023-10-13 06:02:03', '2023-10-13 06:02:03', NULL, 1),
(76, '2023-10-13', '11:07:47', '2023-10-13 06:07:47', '2023-10-13 06:07:47', NULL, 1),
(77, '2023-10-13', '11:25:28', '2023-10-13 06:25:28', '2023-10-13 06:25:28', NULL, 1),
(78, '2023-10-13', '11:33:11', '2023-10-13 06:33:11', '2023-10-13 06:33:11', NULL, 1),
(79, '2023-10-13', '11:35:44', '2023-10-13 06:35:44', '2023-10-13 06:35:44', NULL, 1),
(80, '2023-10-13', '11:46:35', '2023-10-13 06:46:35', '2023-10-13 06:46:35', NULL, 1),
(81, '2023-10-13', '12:08:53', '2023-10-13 07:08:53', '2023-10-13 07:08:53', NULL, 7),
(82, '2023-10-13', '12:17:07', '2023-10-13 07:17:07', '2023-10-13 07:17:07', NULL, 8),
(83, '2023-10-13', '15:06:58', '2023-10-13 10:06:58', '2023-10-13 10:06:58', NULL, 1),
(84, '2023-10-13', '15:13:18', '2023-10-13 10:13:18', '2023-10-13 10:13:18', NULL, 1),
(85, '2023-10-13', '15:14:07', '2023-10-13 10:14:07', '2023-10-13 10:14:07', NULL, 1),
(86, '2023-10-13', '15:49:30', '2023-10-13 10:49:30', '2023-10-13 10:49:30', NULL, 1),
(87, '2023-10-13', '15:51:15', '2023-10-13 10:51:15', '2023-10-13 10:51:15', NULL, 7),
(88, '2023-10-13', '15:53:00', '2023-10-13 10:53:00', '2023-10-13 10:53:00', NULL, 8),
(89, '2023-10-13', '16:08:20', '2023-10-13 11:08:20', '2023-10-13 11:08:20', NULL, 1),
(90, '2023-10-13', '17:04:37', '2023-10-13 12:04:37', '2023-10-13 12:04:37', NULL, 1),
(91, '2023-10-13', '17:07:07', '2023-10-13 12:07:07', '2023-10-13 12:07:07', NULL, 7),
(92, '2023-10-13', '17:08:51', '2023-10-13 12:08:51', '2023-10-13 12:08:51', NULL, 8),
(93, '2023-10-13', '17:37:57', '2023-10-13 12:37:57', '2023-10-13 12:37:57', NULL, 7),
(94, '2023-10-13', '17:41:00', '2023-10-13 12:41:00', '2023-10-13 12:41:00', NULL, 8),
(95, '2023-10-13', '17:51:32', '2023-10-13 12:51:33', '2023-10-13 12:51:33', NULL, 1),
(96, '2023-10-13', '17:53:17', '2023-10-13 12:53:17', '2023-10-13 12:53:17', NULL, 7),
(97, '2023-10-13', '17:54:32', '2023-10-13 12:54:32', '2023-10-13 12:54:32', NULL, 8),
(98, '2023-10-13', '18:07:09', '2023-10-13 13:07:09', '2023-10-13 13:07:09', NULL, 7),
(99, '2023-10-13', '18:07:09', '2023-10-13 13:07:09', '2023-10-13 13:07:09', NULL, 8),
(100, '2023-10-13', '18:07:09', '2023-10-13 13:07:09', '2023-10-13 13:07:09', NULL, 10),
(101, '2023-10-13', '18:09:03', '2023-10-13 13:09:03', '2023-10-13 13:09:03', NULL, 7),
(102, '2023-10-13', '18:09:06', '2023-10-13 13:09:06', '2023-10-13 13:09:06', NULL, 7),
(103, '2023-10-13', '18:09:10', '2023-10-13 13:09:10', '2023-10-13 13:09:10', NULL, 7),
(104, '2023-10-13', '18:13:57', '2023-10-13 13:13:57', '2023-10-13 13:13:57', NULL, 8),
(105, '2023-10-13', '18:14:00', '2023-10-13 13:14:00', '2023-10-13 13:14:00', NULL, 8),
(106, '2023-10-13', '18:14:02', '2023-10-13 13:14:02', '2023-10-13 13:14:02', NULL, 8),
(114, '2023-10-13', '18:29:03', '2023-10-13 13:29:03', '2023-10-13 13:29:03', NULL, 1),
(115, '2023-10-13', '18:32:40', '2023-10-13 13:32:40', '2023-10-13 13:32:40', NULL, 1),
(116, '2023-10-13', '18:36:05', '2023-10-13 13:36:05', '2023-10-13 13:36:05', NULL, 7),
(117, '2023-10-13', '18:36:30', '2023-10-13 13:36:30', '2023-10-13 13:36:30', NULL, 8),
(124, '2023-10-13', '19:07:02', '2023-10-13 14:07:02', '2023-10-13 14:07:02', NULL, 1),
(125, '2023-10-13', '19:07:55', '2023-10-13 14:07:55', '2023-10-13 14:07:55', NULL, 7),
(126, '2023-10-13', '19:08:06', '2023-10-13 14:08:06', '2023-10-13 14:08:06', NULL, 8),
(127, '2023-10-13', '19:10:53', '2023-10-13 14:10:53', '2023-10-13 14:10:53', NULL, 1),
(128, '2023-10-13', '19:23:36', '2023-10-13 14:23:36', '2023-10-13 14:23:36', NULL, 1),
(129, '2023-10-13', '19:24:15', '2023-10-13 14:24:15', '2023-10-13 14:24:15', NULL, 7),
(130, '2023-10-13', '19:24:21', '2023-10-13 14:24:21', '2023-10-13 14:24:21', NULL, 8),
(131, '2023-10-13', '19:31:58', '2023-10-13 14:31:58', '2023-10-13 14:31:58', NULL, 1),
(132, '2023-10-16', '10:18:49', '2023-10-16 05:18:49', '2023-10-16 05:18:49', NULL, 7),
(133, '2023-10-16', '11:20:20', '2023-10-16 06:20:20', '2023-10-16 06:20:20', NULL, 7),
(134, '2023-10-16', '14:55:52', '2023-10-16 09:55:52', '2023-10-16 09:55:52', NULL, 1),
(135, '2023-10-16', '14:57:34', '2023-10-16 09:57:34', '2023-10-16 09:57:34', NULL, 1),
(136, '2023-10-16', '14:57:58', '2023-10-16 09:57:58', '2023-10-16 09:57:58', NULL, 1),
(137, '2023-10-16', '14:58:12', '2023-10-16 09:58:12', '2023-10-16 09:58:12', NULL, 1),
(138, '2023-10-16', '15:13:58', '2023-10-16 10:13:58', '2023-10-16 10:13:58', NULL, 7),
(139, '2023-10-16', '15:14:02', '2023-10-16 10:14:02', '2023-10-16 10:14:02', NULL, 8),
(140, '2023-10-16', '16:59:03', '2023-10-16 11:59:03', '2023-10-16 11:59:03', NULL, 7),
(141, '2023-10-16', '16:59:06', '2023-10-16 11:59:06', '2023-10-16 11:59:06', NULL, 8),
(142, '2023-10-16', '16:59:13', '2023-10-16 11:59:13', '2023-10-16 11:59:13', NULL, 1),
(143, '2023-10-16', '17:00:02', '2023-10-16 12:00:02', '2023-10-16 12:00:02', NULL, 7),
(144, '2023-10-16', '17:00:13', '2023-10-16 12:00:13', '2023-10-16 12:00:13', NULL, 8),
(145, '2023-10-16', '17:42:35', '2023-10-16 12:42:35', '2023-10-16 12:42:35', NULL, 1),
(146, '2023-10-16', '17:43:21', '2023-10-16 12:43:21', '2023-10-16 12:43:21', NULL, 7),
(147, '2023-10-16', '17:43:30', '2023-10-16 12:43:30', '2023-10-16 12:43:30', NULL, 8),
(148, '2023-10-16', '17:47:41', '2023-10-16 12:47:41', '2023-10-16 12:47:41', NULL, 7),
(149, '2023-10-16', '17:47:49', '2023-10-16 12:47:49', '2023-10-16 12:47:49', NULL, 1),
(150, '2023-10-16', '17:48:31', '2023-10-16 12:48:31', '2023-10-16 12:48:31', NULL, 8),
(151, '2023-10-16', '17:48:52', '2023-10-16 12:48:52', '2023-10-16 12:48:52', NULL, 8),
(152, '2023-10-16', '17:50:04', '2023-10-16 12:50:04', '2023-10-16 12:50:04', NULL, 7),
(153, '2023-10-16', '17:50:19', '2023-10-16 12:50:19', '2023-10-16 12:50:19', NULL, 8),
(154, '2023-10-16', '17:50:21', '2023-10-16 12:50:21', '2023-10-16 12:50:21', NULL, 8),
(155, '2023-10-16', '17:50:27', '2023-10-16 12:50:27', '2023-10-16 12:50:27', NULL, 8),
(156, '2023-10-16', '17:56:14', '2023-10-16 12:56:14', '2023-10-16 12:56:14', NULL, 1),
(157, '2023-10-16', '17:59:21', '2023-10-16 12:59:21', '2023-10-16 12:59:21', NULL, 8),
(158, '2023-10-16', '17:59:28', '2023-10-16 12:59:28', '2023-10-16 12:59:28', NULL, 7),
(159, '2023-10-16', '17:59:32', '2023-10-16 12:59:32', '2023-10-16 12:59:32', NULL, 8),
(160, '2023-10-16', '18:07:02', '2023-10-16 13:07:02', '2023-10-16 13:07:02', NULL, 1),
(161, '2023-10-16', '18:08:12', '2023-10-16 13:08:12', '2023-10-16 13:08:12', NULL, 1),
(162, '2023-10-16', '18:09:22', '2023-10-16 13:09:22', '2023-10-16 13:09:22', NULL, 1),
(163, '2023-10-16', '18:10:45', '2023-10-16 13:10:45', '2023-10-16 13:10:45', NULL, 8),
(164, '2023-10-16', '18:16:08', '2023-10-16 13:16:08', '2023-10-16 13:16:08', NULL, 7),
(165, '2023-10-16', '18:16:24', '2023-10-16 13:16:24', '2023-10-16 13:16:24', NULL, 8),
(166, '2023-10-16', '18:16:45', '2023-10-16 13:16:45', '2023-10-16 13:16:45', NULL, 7),
(167, '2023-10-16', '18:16:55', '2023-10-16 13:16:55', '2023-10-16 13:16:55', NULL, 8),
(168, '2023-10-16', '18:17:14', '2023-10-16 13:17:14', '2023-10-16 13:17:14', NULL, 7),
(169, '2023-10-16', '18:17:23', '2023-10-16 13:17:23', '2023-10-16 13:17:23', NULL, 8),
(170, '2023-10-16', '18:25:16', '2023-10-16 13:25:16', '2023-10-16 13:25:16', NULL, 7),
(171, '2023-10-16', '18:29:32', '2023-10-16 13:29:32', '2023-10-16 13:29:32', NULL, 8),
(172, '2023-10-16', '18:31:00', '2023-10-16 13:31:00', '2023-10-16 13:31:00', NULL, 7),
(173, '2023-10-16', '18:32:20', '2023-10-16 13:32:20', '2023-10-16 13:32:20', NULL, 8),
(174, '2023-10-16', '18:34:50', '2023-10-16 13:34:50', '2023-10-16 13:34:50', NULL, 7),
(175, '2023-10-16', '18:35:19', '2023-10-16 13:35:19', '2023-10-16 13:35:19', NULL, 7),
(176, '2023-10-16', '18:36:55', '2023-10-16 13:36:55', '2023-10-16 13:36:55', NULL, 8),
(177, '2023-10-16', '18:37:16', '2023-10-16 13:37:16', '2023-10-16 13:37:16', NULL, 7),
(178, '2023-10-16', '18:37:27', '2023-10-16 13:37:27', '2023-10-16 13:37:27', NULL, 8),
(179, '2023-10-17', '09:46:30', '2023-10-17 04:46:30', '2023-10-17 04:46:30', NULL, 7),
(180, '2023-10-17', '09:47:29', '2023-10-17 04:47:29', '2023-10-17 04:47:29', NULL, 7),
(181, '2023-10-17', '09:58:48', '2023-10-17 04:58:48', '2023-10-17 04:58:48', NULL, 8),
(182, '2023-10-17', '10:23:35', '2023-10-17 05:23:35', '2023-10-17 05:23:35', NULL, 7),
(183, '2023-10-17', '10:49:08', '2023-10-17 05:49:08', '2023-10-17 05:49:08', NULL, 8),
(186, '2023-10-17', '11:29:06', '2023-10-17 06:29:06', '2023-10-17 06:29:06', NULL, 1),
(187, '2023-10-17', '11:30:09', '2023-10-17 06:30:09', '2023-10-17 06:30:09', NULL, 7),
(188, '2023-10-17', '11:30:26', '2023-10-17 06:30:26', '2023-10-17 06:30:26', NULL, 8),
(189, '2023-10-17', '11:39:25', '2023-10-17 06:39:25', '2023-10-17 06:39:25', NULL, 1),
(190, '2023-10-17', '11:45:42', '2023-10-17 06:45:42', '2023-10-17 06:45:42', NULL, 7),
(191, '2023-10-17', '11:45:49', '2023-10-17 06:45:49', '2023-10-17 06:45:49', NULL, 8),
(192, '2023-10-17', '12:02:26', '2023-10-17 07:02:26', '2023-10-17 07:02:26', NULL, 1),
(193, '2023-10-17', '12:04:40', '2023-10-17 07:04:40', '2023-10-17 07:04:40', NULL, 7),
(194, '2023-10-17', '12:04:55', '2023-10-17 07:04:55', '2023-10-17 07:04:55', NULL, 8),
(195, '2023-10-17', '12:26:02', '2023-10-17 07:26:02', '2023-10-17 07:26:02', NULL, 7),
(196, '2023-10-17', '14:17:15', '2023-10-17 09:17:15', '2023-10-17 09:17:15', NULL, 1),
(197, '2023-10-17', '14:17:22', '2023-10-17 09:17:22', '2023-10-17 09:17:22', NULL, 1),
(198, '2023-10-17', '14:17:23', '2023-10-17 09:17:23', '2023-10-17 09:17:23', NULL, 1),
(199, '2023-10-17', '14:19:39', '2023-10-17 09:19:39', '2023-10-17 09:19:39', NULL, 1),
(200, '2023-10-17', '14:19:46', '2023-10-17 09:19:46', '2023-10-17 09:19:46', NULL, 1),
(201, '2023-10-17', '14:21:41', '2023-10-17 09:21:41', '2023-10-17 09:21:41', NULL, 1),
(202, '2023-10-17', '14:39:30', '2023-10-17 09:39:30', '2023-10-17 09:39:30', NULL, 1),
(203, '2023-10-17', '14:47:58', '2023-10-17 09:47:58', '2023-10-17 09:47:58', NULL, 1),
(204, '2023-10-17', '14:53:22', '2023-10-17 09:53:22', '2023-10-17 09:53:22', NULL, 1),
(205, '2023-10-17', '14:55:59', '2023-10-17 09:55:59', '2023-10-17 09:55:59', NULL, 1),
(206, '2023-10-17', '14:57:34', '2023-10-17 09:57:34', '2023-10-17 09:57:34', NULL, 7),
(207, '2023-10-17', '14:58:02', '2023-10-17 09:58:02', '2023-10-17 09:58:02', NULL, 8),
(208, '2023-10-17', '15:03:08', '2023-10-17 10:03:08', '2023-10-17 10:03:08', NULL, 7),
(209, '2023-10-17', '15:03:25', '2023-10-17 10:03:25', '2023-10-17 10:03:25', NULL, 7),
(210, '2023-10-17', '15:03:41', '2023-10-17 10:03:41', '2023-10-17 10:03:41', NULL, 7),
(211, '2023-10-17', '15:04:21', '2023-10-17 10:04:21', '2023-10-17 10:04:21', NULL, 8),
(212, '2023-10-17', '15:04:37', '2023-10-17 10:04:37', '2023-10-17 10:04:37', NULL, 8),
(213, '2023-10-17', '15:05:00', '2023-10-17 10:05:00', '2023-10-17 10:05:00', NULL, 8),
(214, '2023-10-17', '15:06:28', '2023-10-17 10:06:28', '2023-10-17 10:06:28', NULL, 7),
(215, '2023-10-17', '15:06:48', '2023-10-17 10:06:48', '2023-10-17 10:06:48', NULL, 7),
(216, '2023-10-17', '15:07:08', '2023-10-17 10:07:08', '2023-10-17 10:07:08', NULL, 8),
(217, '2023-10-17', '15:21:26', '2023-10-17 10:21:26', '2023-10-17 10:21:26', NULL, 1),
(218, '2023-10-17', '15:21:51', '2023-10-17 10:21:51', '2023-10-17 10:21:51', NULL, 1),
(219, '2023-10-17', '16:52:04', '2023-10-17 11:52:04', '2023-10-17 11:52:04', NULL, 7),
(220, '2023-10-17', '16:52:21', '2023-10-17 11:52:21', '2023-10-17 11:52:21', NULL, 8),
(221, '2023-10-17', '17:23:46', '2023-10-17 12:23:46', '2023-10-17 12:23:46', NULL, 7),
(222, '2023-10-17', '17:23:46', '2023-10-17 12:23:46', '2023-10-17 12:23:46', NULL, 8),
(223, '2023-10-17', '17:23:46', '2023-10-17 12:23:46', '2023-10-17 12:23:46', NULL, 10),
(224, '2023-10-17', '17:24:01', '2023-10-17 12:24:01', '2023-10-17 12:24:01', NULL, 7),
(225, '2023-10-17', '17:24:01', '2023-10-17 12:24:01', '2023-10-17 12:24:01', NULL, 8),
(226, '2023-10-17', '17:24:01', '2023-10-17 12:24:01', '2023-10-17 12:24:01', NULL, 10),
(227, '2023-10-17', '17:24:10', '2023-10-17 12:24:10', '2023-10-17 12:24:10', NULL, 7),
(228, '2023-10-17', '17:24:10', '2023-10-17 12:24:10', '2023-10-17 12:24:10', NULL, 8),
(229, '2023-10-17', '17:24:10', '2023-10-17 12:24:10', '2023-10-17 12:24:10', NULL, 10),
(230, '2023-10-18', '10:08:50', '2023-10-18 05:08:50', '2023-10-18 05:08:50', NULL, 1),
(231, '2023-10-18', '10:11:44', '2023-10-18 05:11:44', '2023-10-18 05:11:44', NULL, 7),
(232, '2023-10-18', '10:11:52', '2023-10-18 05:11:52', '2023-10-18 05:11:52', NULL, 8),
(233, '2023-10-18', '10:38:46', '2023-10-18 05:38:46', '2023-10-18 05:38:46', NULL, 7),
(234, '2023-10-18', '10:38:46', '2023-10-18 05:38:46', '2023-10-18 05:38:46', NULL, 8),
(235, '2023-10-18', '10:38:46', '2023-10-18 05:38:46', '2023-10-18 05:38:46', NULL, 10),
(236, '2023-10-18', '10:38:50', '2023-10-18 05:38:50', '2023-10-18 05:38:50', NULL, 7),
(237, '2023-10-18', '10:38:50', '2023-10-18 05:38:50', '2023-10-18 05:38:50', NULL, 8),
(238, '2023-10-18', '10:38:50', '2023-10-18 05:38:50', '2023-10-18 05:38:50', NULL, 10),
(239, '2023-10-18', '10:38:53', '2023-10-18 05:38:53', '2023-10-18 05:38:53', NULL, 7),
(240, '2023-10-18', '10:38:53', '2023-10-18 05:38:53', '2023-10-18 05:38:53', NULL, 8),
(241, '2023-10-18', '10:38:53', '2023-10-18 05:38:53', '2023-10-18 05:38:53', NULL, 10),
(242, '2023-10-18', '10:40:00', '2023-10-18 05:40:00', '2023-10-18 05:40:00', NULL, 7),
(243, '2023-10-18', '10:40:00', '2023-10-18 05:40:00', '2023-10-18 05:40:00', NULL, 8),
(244, '2023-10-18', '10:40:00', '2023-10-18 05:40:00', '2023-10-18 05:40:00', NULL, 10),
(245, '2023-10-18', '10:40:09', '2023-10-18 05:40:09', '2023-10-18 05:40:09', NULL, 7),
(246, '2023-10-18', '10:40:09', '2023-10-18 05:40:09', '2023-10-18 05:40:09', NULL, 8),
(247, '2023-10-18', '10:40:09', '2023-10-18 05:40:09', '2023-10-18 05:40:09', NULL, 10),
(248, '2023-10-18', '10:41:04', '2023-10-18 05:41:04', '2023-10-18 05:41:04', NULL, 7),
(249, '2023-10-18', '10:41:04', '2023-10-18 05:41:04', '2023-10-18 05:41:04', NULL, 8),
(250, '2023-10-18', '10:41:04', '2023-10-18 05:41:04', '2023-10-18 05:41:04', NULL, 10),
(251, '2023-10-18', '10:41:20', '2023-10-18 05:41:20', '2023-10-18 05:41:20', NULL, 7),
(252, '2023-10-18', '10:41:20', '2023-10-18 05:41:20', '2023-10-18 05:41:20', NULL, 8),
(253, '2023-10-18', '10:41:20', '2023-10-18 05:41:20', '2023-10-18 05:41:20', NULL, 10),
(254, '2023-10-18', '10:50:43', '2023-10-18 05:50:43', '2023-10-18 05:50:43', NULL, 7),
(255, '2023-10-18', '11:46:38', '2023-10-18 06:46:38', '2023-10-18 06:46:38', NULL, 1),
(256, '2023-10-18', '11:54:33', '2023-10-18 06:54:33', '2023-10-18 06:54:33', NULL, 1),
(257, '2023-10-18', '12:01:28', '2023-10-18 07:01:28', '2023-10-18 07:01:28', NULL, 8),
(258, '2023-10-18', '12:04:47', '2023-10-18 07:04:47', '2023-10-18 07:04:47', NULL, 1),
(259, '2023-10-18', '12:11:09', '2023-10-18 07:11:09', '2023-10-18 07:11:09', NULL, NULL),
(260, '2023-10-18', '12:15:07', '2023-10-18 07:15:07', '2023-10-18 07:15:07', NULL, 7),
(261, '2023-10-18', '12:17:11', '2023-10-18 07:17:11', '2023-10-18 07:17:11', NULL, 7),
(262, '2023-10-18', '12:21:08', '2023-10-18 07:21:08', '2023-10-18 07:21:08', NULL, 7),
(263, '2023-10-18', '12:23:13', '2023-10-18 07:23:13', '2023-10-18 07:23:13', NULL, 7),
(264, '2023-10-18', '12:23:13', '2023-10-18 07:23:13', '2023-10-18 07:23:13', NULL, 8),
(265, '2023-10-18', '12:23:13', '2023-10-18 07:23:13', '2023-10-18 07:23:13', NULL, 10),
(266, '2023-10-18', '12:24:08', '2023-10-18 07:24:08', '2023-10-18 07:24:08', NULL, 7),
(267, '2023-10-18', '12:24:08', '2023-10-18 07:24:08', '2023-10-18 07:24:08', NULL, 8),
(268, '2023-10-18', '12:24:08', '2023-10-18 07:24:08', '2023-10-18 07:24:08', NULL, 10),
(269, '2023-10-18', '12:30:09', '2023-10-18 07:30:09', '2023-10-18 07:30:09', NULL, 1),
(270, '2023-10-18', '12:30:48', '2023-10-18 07:30:48', '2023-10-18 07:30:48', NULL, 7),
(271, '2023-10-18', '12:50:08', '2023-10-18 07:50:08', '2023-10-18 07:50:08', NULL, 1),
(277, '2023-10-18', '14:20:37', '2023-10-18 09:20:37', '2023-10-18 09:20:37', NULL, 1),
(278, '2023-10-18', '14:21:12', '2023-10-18 09:21:12', '2023-10-18 09:21:12', NULL, 1),
(279, '2023-10-18', '14:23:39', '2023-10-18 09:23:39', '2023-10-18 09:23:39', NULL, 1),
(280, '2023-10-18', '14:31:16', '2023-10-18 09:31:16', '2023-10-18 09:31:16', NULL, 8),
(281, '2023-10-18', '14:37:39', '2023-10-18 09:37:39', '2023-10-18 09:37:39', NULL, 8),
(282, '2023-10-18', '14:37:43', '2023-10-18 09:37:43', '2023-10-18 09:37:43', NULL, 8),
(283, '2023-10-18', '14:57:29', '2023-10-18 09:57:29', '2023-10-18 09:57:29', NULL, 8),
(284, '2023-10-18', '15:04:12', '2023-10-18 10:04:12', '2023-10-18 10:04:12', NULL, 7),
(285, '2023-10-18', '15:04:59', '2023-10-18 10:04:59', '2023-10-18 10:04:59', NULL, 7),
(286, '2023-10-18', '15:09:40', '2023-10-18 10:09:40', '2023-10-18 10:09:40', NULL, 8),
(287, '2023-10-18', '15:11:07', '2023-10-18 10:11:07', '2023-10-18 10:11:07', NULL, 8),
(288, '2023-10-18', '15:12:29', '2023-10-18 10:12:29', '2023-10-18 10:12:29', NULL, 7),
(289, '2023-10-18', '15:12:46', '2023-10-18 10:12:46', '2023-10-18 10:12:46', NULL, 8),
(290, '2023-10-18', '15:13:34', '2023-10-18 10:13:34', '2023-10-18 10:13:34', NULL, 8),
(291, '2023-10-18', '15:19:20', '2023-10-18 10:19:20', '2023-10-18 10:19:20', NULL, 7),
(292, '2023-10-18', '15:21:14', '2023-10-18 10:21:14', '2023-10-18 10:21:14', NULL, 8),
(293, '2023-10-18', '15:23:21', '2023-10-18 10:23:21', '2023-10-18 10:23:21', NULL, 7),
(294, '2023-10-18', '15:23:55', '2023-10-18 10:23:55', '2023-10-18 10:23:55', NULL, 8),
(295, '2023-10-18', '15:26:24', '2023-10-18 10:26:24', '2023-10-18 10:26:24', NULL, 7),
(296, '2023-10-18', '15:26:42', '2023-10-18 10:26:42', '2023-10-18 10:26:42', NULL, 8),
(297, '2023-10-18', '15:36:09', '2023-10-18 10:36:09', '2023-10-18 10:36:09', NULL, 1),
(298, '2023-10-18', '15:38:54', '2023-10-18 10:38:54', '2023-10-18 10:38:54', NULL, 8),
(299, '2023-10-18', '15:53:46', '2023-10-18 10:53:46', '2023-10-18 10:53:46', NULL, 1),
(300, '2023-10-18', '16:01:18', '2023-10-18 11:01:18', '2023-10-18 11:01:18', NULL, 1),
(301, '2023-10-18', '16:01:57', '2023-10-18 11:01:57', '2023-10-18 11:01:57', NULL, 8),
(302, '2023-10-18', '16:02:41', '2023-10-18 11:02:41', '2023-10-18 11:02:41', NULL, 1),
(303, '2023-10-18', '16:03:40', '2023-10-18 11:03:40', '2023-10-18 11:03:40', NULL, 1),
(304, '2023-10-18', '16:07:35', '2023-10-18 11:07:35', '2023-10-18 11:07:35', NULL, 1),
(305, '2023-10-18', '16:32:25', '2023-10-18 11:32:25', '2023-10-18 11:32:25', NULL, 8),
(307, '2023-10-18', '16:51:14', '2023-10-18 11:51:14', '2023-10-18 11:51:14', NULL, 7),
(311, '2023-10-18', '17:12:07', '2023-10-18 12:12:07', '2023-10-18 12:12:07', NULL, 1),
(312, '2023-10-18', '17:12:40', '2023-10-18 12:12:40', '2023-10-18 12:12:40', NULL, 1),
(315, '2023-10-18', '17:19:46', '2023-10-18 12:19:46', '2023-10-18 12:19:46', NULL, 7),
(316, '2023-10-18', '17:20:30', '2023-10-18 12:20:30', '2023-10-18 12:20:30', NULL, 7),
(317, '2023-10-18', '17:20:46', '2023-10-18 12:20:46', '2023-10-18 12:20:46', NULL, 7),
(318, '2023-10-18', '17:22:19', '2023-10-18 12:22:19', '2023-10-18 12:22:19', NULL, 7),
(319, '2023-10-18', '17:22:19', '2023-10-18 12:22:19', '2023-10-18 12:22:19', NULL, 7),
(320, '2023-10-18', '17:22:19', '2023-10-18 12:22:19', '2023-10-18 12:22:19', NULL, 7),
(321, '2023-10-18', '17:22:19', '2023-10-18 12:22:19', '2023-10-18 12:22:19', NULL, 7),
(323, '2023-10-18', '17:29:29', '2023-10-18 12:29:29', '2023-10-18 12:29:29', NULL, 7),
(324, '2023-10-18', '17:29:29', '2023-10-18 12:29:29', '2023-10-18 12:29:29', NULL, 7),
(325, '2023-10-18', '17:29:29', '2023-10-18 12:29:29', '2023-10-18 12:29:29', NULL, 7),
(326, '2023-10-18', '17:29:29', '2023-10-18 12:29:29', '2023-10-18 12:29:29', NULL, 7),
(327, '2023-10-18', '17:29:29', '2023-10-18 12:29:29', '2023-10-18 12:29:29', NULL, 7),
(329, '2023-10-18', '17:31:10', '2023-10-18 12:31:10', '2023-10-18 12:31:10', NULL, 7),
(331, '2023-10-19', '10:56:53', '2023-10-19 05:56:53', '2023-10-19 05:56:53', NULL, 7),
(332, '2023-10-19', '10:59:40', '2023-10-19 05:59:40', '2023-10-19 05:59:40', NULL, 1),
(333, '2023-10-19', '11:01:01', '2023-10-19 06:01:01', '2023-10-19 06:01:01', NULL, 7),
(334, '2023-10-19', '11:47:52', '2023-10-19 06:47:52', '2023-10-19 06:47:52', NULL, 7),
(335, '2023-10-19', '12:06:06', '2023-10-19 07:06:06', '2023-10-19 07:06:06', NULL, 1),
(336, '2023-10-19', '12:49:01', '2023-10-19 07:49:01', '2023-10-19 07:49:01', NULL, 7),
(337, '2023-10-19', '14:15:03', '2023-10-19 09:15:03', '2023-10-19 09:15:03', NULL, 8),
(338, '2023-10-19', '16:11:41', '2023-10-19 11:11:41', '2023-10-19 11:11:41', NULL, NULL),
(340, '2023-10-19', '18:06:11', '2023-10-19 13:06:11', '2023-10-19 13:06:11', NULL, 1),
(341, '2023-10-20', '09:31:52', '2023-10-20 04:31:52', '2023-10-20 04:31:52', NULL, NULL),
(342, '2023-10-20', '09:32:50', '2023-10-20 04:32:50', '2023-10-20 04:32:50', NULL, 7),
(356, '2023-10-20', '11:35:46', '2023-10-20 06:35:46', '2023-10-20 06:35:46', NULL, 7),
(357, '2023-10-20', '11:35:46', '2023-10-20 06:35:46', '2023-10-20 06:35:46', NULL, 8),
(358, '2023-10-20', '11:35:46', '2023-10-20 06:35:46', '2023-10-20 06:35:46', NULL, 10),
(360, '2023-10-20', '12:17:38', '2023-10-20 07:17:38', '2023-10-20 07:17:38', NULL, 7),
(361, '2023-10-20', '12:17:38', '2023-10-20 07:17:38', '2023-10-20 07:17:38', NULL, 8),
(362, '2023-10-20', '12:17:38', '2023-10-20 07:17:38', '2023-10-20 07:17:38', NULL, 10),
(363, '2023-10-20', '12:36:01', '2023-10-20 07:36:01', '2023-10-20 07:36:01', NULL, 7),
(364, '2023-10-20', '12:36:01', '2023-10-20 07:36:01', '2023-10-20 07:36:01', NULL, 8),
(365, '2023-10-20', '12:36:01', '2023-10-20 07:36:01', '2023-10-20 07:36:01', NULL, 10),
(366, '2023-10-20', '13:19:19', '2023-10-20 08:19:19', '2023-10-20 08:19:19', NULL, 1),
(367, '2023-10-20', '13:20:17', '2023-10-20 08:20:17', '2023-10-20 08:20:17', NULL, 7),
(368, '2023-10-20', '13:30:53', '2023-10-20 08:30:53', '2023-10-20 08:30:53', NULL, 1),
(369, '2023-10-20', '13:33:20', '2023-10-20 08:33:20', '2023-10-20 08:33:20', NULL, 7),
(370, '2023-10-20', '15:26:25', '2023-10-20 10:26:25', '2023-10-20 10:26:25', NULL, 7),
(371, '2023-10-20', '15:26:25', '2023-10-20 10:26:25', '2023-10-20 10:26:25', NULL, 8),
(372, '2023-10-20', '15:26:25', '2023-10-20 10:26:25', '2023-10-20 10:26:25', NULL, 10),
(373, '2023-10-20', '15:26:39', '2023-10-20 10:26:39', '2023-10-20 10:26:39', NULL, 7),
(374, '2023-10-20', '15:26:39', '2023-10-20 10:26:39', '2023-10-20 10:26:39', NULL, 8),
(375, '2023-10-20', '15:26:39', '2023-10-20 10:26:39', '2023-10-20 10:26:39', NULL, 10),
(376, '2023-10-20', '15:26:43', '2023-10-20 10:26:43', '2023-10-20 10:26:43', NULL, 7),
(377, '2023-10-20', '15:26:43', '2023-10-20 10:26:43', '2023-10-20 10:26:43', NULL, 8),
(378, '2023-10-20', '15:26:43', '2023-10-20 10:26:43', '2023-10-20 10:26:43', NULL, 10),
(379, '2023-10-20', '15:26:54', '2023-10-20 10:26:54', '2023-10-20 10:26:54', NULL, 7),
(380, '2023-10-20', '15:26:54', '2023-10-20 10:26:54', '2023-10-20 10:26:54', NULL, 8),
(381, '2023-10-20', '15:26:54', '2023-10-20 10:26:54', '2023-10-20 10:26:54', NULL, 10),
(382, '2023-10-20', '15:26:58', '2023-10-20 10:26:58', '2023-10-20 10:26:58', NULL, 7),
(383, '2023-10-20', '15:26:58', '2023-10-20 10:26:58', '2023-10-20 10:26:58', NULL, 8),
(384, '2023-10-20', '15:26:58', '2023-10-20 10:26:58', '2023-10-20 10:26:58', NULL, 10),
(385, '2023-10-20', '15:27:15', '2023-10-20 10:27:15', '2023-10-20 10:27:15', NULL, 7),
(386, '2023-10-20', '15:27:15', '2023-10-20 10:27:15', '2023-10-20 10:27:15', NULL, 8),
(387, '2023-10-20', '15:27:15', '2023-10-20 10:27:15', '2023-10-20 10:27:15', NULL, 10),
(388, '2023-10-20', '15:44:09', '2023-10-20 10:44:09', '2023-10-20 10:44:09', NULL, 1),
(389, '2023-10-20', '15:45:32', '2023-10-20 10:45:32', '2023-10-20 10:45:32', NULL, 7),
(393, '2023-10-20', '16:04:56', '2023-10-20 11:04:56', '2023-10-20 11:04:56', NULL, 1),
(394, '2023-10-20', '16:05:15', '2023-10-20 11:05:15', '2023-10-20 11:05:15', NULL, 7),
(414, '2023-10-20', '16:46:43', '2023-10-20 11:46:43', '2023-10-20 11:46:43', NULL, 7),
(415, '2023-10-20', '16:46:43', '2023-10-20 11:46:43', '2023-10-20 11:46:43', NULL, 8),
(416, '2023-10-20', '16:46:43', '2023-10-20 11:46:43', '2023-10-20 11:46:43', NULL, 10),
(417, '2023-10-20', '16:49:28', '2023-10-20 11:49:28', '2023-10-20 11:49:28', NULL, 7),
(418, '2023-10-20', '16:49:28', '2023-10-20 11:49:28', '2023-10-20 11:49:28', NULL, 8),
(419, '2023-10-20', '16:49:28', '2023-10-20 11:49:28', '2023-10-20 11:49:28', NULL, 10),
(420, '2023-10-20', '16:52:21', '2023-10-20 11:52:21', '2023-10-20 11:52:21', NULL, 7),
(421, '2023-10-20', '16:52:21', '2023-10-20 11:52:21', '2023-10-20 11:52:21', NULL, 8),
(422, '2023-10-20', '16:52:21', '2023-10-20 11:52:22', '2023-10-20 11:52:22', NULL, 10),
(423, '2023-10-20', '16:52:23', '2023-10-20 11:52:23', '2023-10-20 11:52:23', NULL, 7),
(424, '2023-10-20', '16:52:23', '2023-10-20 11:52:23', '2023-10-20 11:52:23', NULL, 8),
(425, '2023-10-20', '16:52:23', '2023-10-20 11:52:23', '2023-10-20 11:52:23', NULL, 10),
(426, '2023-10-20', '16:52:26', '2023-10-20 11:52:26', '2023-10-20 11:52:26', NULL, 7),
(427, '2023-10-20', '16:52:26', '2023-10-20 11:52:26', '2023-10-20 11:52:26', NULL, 8),
(428, '2023-10-20', '16:52:26', '2023-10-20 11:52:27', '2023-10-20 11:52:27', NULL, 10),
(429, '2023-10-20', '16:52:29', '2023-10-20 11:52:29', '2023-10-20 11:52:29', NULL, 7),
(430, '2023-10-20', '16:52:29', '2023-10-20 11:52:29', '2023-10-20 11:52:29', NULL, 8),
(431, '2023-10-20', '16:52:29', '2023-10-20 11:52:29', '2023-10-20 11:52:29', NULL, 10),
(432, '2023-10-20', '16:52:31', '2023-10-20 11:52:31', '2023-10-20 11:52:31', NULL, 7),
(433, '2023-10-20', '16:52:31', '2023-10-20 11:52:31', '2023-10-20 11:52:31', NULL, 8),
(434, '2023-10-20', '16:52:31', '2023-10-20 11:52:31', '2023-10-20 11:52:31', NULL, 10),
(435, '2023-10-20', '16:52:32', '2023-10-20 11:52:32', '2023-10-20 11:52:32', NULL, 7),
(436, '2023-10-20', '16:52:32', '2023-10-20 11:52:32', '2023-10-20 11:52:32', NULL, 8),
(437, '2023-10-20', '16:52:32', '2023-10-20 11:52:32', '2023-10-20 11:52:32', NULL, 10),
(438, '2023-10-20', '16:52:34', '2023-10-20 11:52:34', '2023-10-20 11:52:34', NULL, 7),
(439, '2023-10-20', '16:52:34', '2023-10-20 11:52:34', '2023-10-20 11:52:34', NULL, 8),
(440, '2023-10-20', '16:52:34', '2023-10-20 11:52:34', '2023-10-20 11:52:34', NULL, 10),
(441, '2023-10-20', '16:52:35', '2023-10-20 11:52:35', '2023-10-20 11:52:35', NULL, 7),
(442, '2023-10-20', '16:52:35', '2023-10-20 11:52:35', '2023-10-20 11:52:35', NULL, 8),
(443, '2023-10-20', '16:52:35', '2023-10-20 11:52:35', '2023-10-20 11:52:35', NULL, 10),
(444, '2023-10-20', '16:52:36', '2023-10-20 11:52:36', '2023-10-20 11:52:36', NULL, 7),
(445, '2023-10-20', '16:52:36', '2023-10-20 11:52:36', '2023-10-20 11:52:36', NULL, 8),
(446, '2023-10-20', '16:52:36', '2023-10-20 11:52:36', '2023-10-20 11:52:36', NULL, 10),
(447, '2023-10-20', '16:52:38', '2023-10-20 11:52:38', '2023-10-20 11:52:38', NULL, 7),
(448, '2023-10-20', '16:52:38', '2023-10-20 11:52:38', '2023-10-20 11:52:38', NULL, 8),
(449, '2023-10-20', '16:52:38', '2023-10-20 11:52:38', '2023-10-20 11:52:38', NULL, 10),
(475, '2023-10-20', '17:51:12', '2023-10-20 12:51:12', '2023-10-20 12:51:12', NULL, 8),
(477, '2023-10-20', '18:04:43', '2023-10-20 13:04:43', '2023-10-20 13:04:43', NULL, 1),
(478, '2023-10-20', '18:08:44', '2023-10-20 13:08:44', '2023-10-20 13:08:44', NULL, 7),
(479, '2023-10-20', '18:08:51', '2023-10-20 13:08:51', '2023-10-20 13:08:51', NULL, 7),
(480, '2023-10-20', '18:09:03', '2023-10-20 13:09:03', '2023-10-20 13:09:03', NULL, 8),
(481, '2023-10-20', '18:09:27', '2023-10-20 13:09:27', '2023-10-20 13:09:27', NULL, 7),
(482, '2023-10-20', '18:09:36', '2023-10-20 13:09:36', '2023-10-20 13:09:36', NULL, 8),
(483, '2023-10-20', '18:18:22', '2023-10-20 13:18:22', '2023-10-20 13:18:22', NULL, 10),
(495, '2023-10-20', '18:52:40', '2023-10-20 13:52:40', '2023-10-20 13:52:40', NULL, 1),
(496, '2023-10-20', '18:52:57', '2023-10-20 13:52:57', '2023-10-20 13:52:57', NULL, 7),
(497, '2023-10-20', '18:54:26', '2023-10-20 13:54:26', '2023-10-20 13:54:26', NULL, 10),
(499, '2023-10-20', '18:55:30', '2023-10-20 13:55:30', '2023-10-20 13:55:30', NULL, 8),
(503, '2023-10-20', '19:21:34', '2023-10-20 14:21:34', '2023-10-20 14:21:34', NULL, 1),
(504, '2023-10-20', '19:21:46', '2023-10-20 14:21:46', '2023-10-20 14:21:46', NULL, 7),
(505, '2023-10-20', '19:24:06', '2023-10-20 14:24:06', '2023-10-20 14:24:06', NULL, 8),
(506, '2023-10-20', '19:24:49', '2023-10-20 14:24:49', '2023-10-20 14:24:49', NULL, 10),
(508, '2023-10-20', '19:29:20', '2023-10-20 14:29:20', '2023-10-20 14:29:20', NULL, 1),
(509, '2023-10-20', '19:29:34', '2023-10-20 14:29:34', '2023-10-20 14:29:34', NULL, 7),
(510, '2023-10-20', '19:29:46', '2023-10-20 14:29:46', '2023-10-20 14:29:46', NULL, 8),
(511, '2023-10-20', '19:31:44', '2023-10-20 14:31:44', '2023-10-20 14:31:44', NULL, 10),
(534, '2023-10-23', '11:04:13', '2023-10-23 06:04:13', '2023-10-23 06:04:13', NULL, 1),
(535, '2023-10-23', '11:11:57', '2023-10-23 06:11:57', '2023-10-23 06:11:57', NULL, 7),
(536, '2023-10-23', '11:12:29', '2023-10-23 06:12:29', '2023-10-23 06:12:29', NULL, 8),
(546, '2023-10-23', '14:22:10', '2023-10-23 09:22:10', '2023-10-23 09:22:10', NULL, 7),
(547, '2023-10-23', '14:22:10', '2023-10-23 09:22:10', '2023-10-23 09:22:10', NULL, 8),
(548, '2023-10-23', '14:22:10', '2023-10-23 09:22:10', '2023-10-23 09:22:10', NULL, 10),
(550, '2023-10-23', '17:19:46', '2023-10-23 12:19:46', '2023-10-23 12:19:46', NULL, 7),
(551, '2023-10-23', '17:19:46', '2023-10-23 12:19:46', '2023-10-23 12:19:46', NULL, 8),
(552, '2023-10-23', '17:19:46', '2023-10-23 12:19:46', '2023-10-23 12:19:46', NULL, 10),
(553, '2023-10-23', '17:19:59', '2023-10-23 12:19:59', '2023-10-23 12:19:59', NULL, 7),
(554, '2023-10-23', '17:19:59', '2023-10-23 12:19:59', '2023-10-23 12:19:59', NULL, 8),
(555, '2023-10-23', '17:19:59', '2023-10-23 12:19:59', '2023-10-23 12:19:59', NULL, 10),
(556, '2023-10-23', '17:20:03', '2023-10-23 12:20:03', '2023-10-23 12:20:03', NULL, 7),
(557, '2023-10-23', '17:20:03', '2023-10-23 12:20:03', '2023-10-23 12:20:03', NULL, 8),
(558, '2023-10-23', '17:20:03', '2023-10-23 12:20:03', '2023-10-23 12:20:03', NULL, 10),
(566, '2023-10-23', '17:31:51', '2023-10-23 12:31:51', '2023-10-23 12:31:51', NULL, 1),
(567, '2023-10-24', '11:42:28', '2023-10-24 06:42:28', '2023-10-24 06:42:28', NULL, 10),
(568, '2023-10-24', '11:44:13', '2023-10-24 06:44:13', '2023-10-24 06:44:13', NULL, 10),
(569, '2023-10-24', '11:58:59', '2023-10-24 06:58:59', '2023-10-24 06:58:59', NULL, 1),
(570, '2023-10-24', '12:01:06', '2023-10-24 07:01:06', '2023-10-24 07:01:06', NULL, 7),
(571, '2023-10-24', '12:01:47', '2023-10-24 07:01:47', '2023-10-24 07:01:47', NULL, 8),
(572, '2023-10-24', '12:09:26', '2023-10-24 07:09:26', '2023-10-24 07:09:26', NULL, 10),
(573, '2023-10-24', '14:20:46', '2023-10-24 09:20:46', '2023-10-24 09:20:46', NULL, 1),
(574, '2023-10-24', '14:22:11', '2023-10-24 09:22:11', '2023-10-24 09:22:11', NULL, 1),
(575, '2023-10-24', '14:22:42', '2023-10-24 09:22:42', '2023-10-24 09:22:42', NULL, 7),
(576, '2023-10-24', '14:23:33', '2023-10-24 09:23:33', '2023-10-24 09:23:33', NULL, 8),
(577, '2023-10-24', '14:52:18', '2023-10-24 09:52:18', '2023-10-24 09:52:18', NULL, 7),
(578, '2023-10-24', '14:52:36', '2023-10-24 09:52:36', '2023-10-24 09:52:36', NULL, 8),
(583, '2023-10-24', '16:07:04', '2023-10-24 11:07:04', '2023-10-24 11:07:04', NULL, 1),
(584, '2023-10-24', '16:10:10', '2023-10-24 11:10:10', '2023-10-24 11:10:10', NULL, 7),
(585, '2023-10-24', '16:10:38', '2023-10-24 11:10:38', '2023-10-24 11:10:38', NULL, 8),
(586, '2023-10-24', '16:13:35', '2023-10-24 11:13:35', '2023-10-24 11:13:35', NULL, 10),
(599, '2023-10-24', '16:33:46', '2023-10-24 11:33:46', '2023-10-24 11:33:46', NULL, 1),
(600, '2023-10-24', '16:33:54', '2023-10-24 11:33:54', '2023-10-24 11:33:54', NULL, 7),
(601, '2023-10-24', '16:34:16', '2023-10-24 11:34:16', '2023-10-24 11:34:16', NULL, 8),
(602, '2023-10-24', '16:34:48', '2023-10-24 11:34:48', '2023-10-24 11:34:48', NULL, 10),
(604, '2023-10-24', '16:50:01', '2023-10-24 11:50:01', '2023-10-24 11:50:01', NULL, 1),
(605, '2023-10-24', '16:50:13', '2023-10-24 11:50:13', '2023-10-24 11:50:13', NULL, 7),
(606, '2023-10-24', '16:50:30', '2023-10-24 11:50:30', '2023-10-24 11:50:30', NULL, 8),
(607, '2023-10-24', '17:03:28', '2023-10-24 12:03:28', '2023-10-24 12:03:28', NULL, 10),
(609, '2023-10-24', '17:07:12', '2023-10-24 12:07:12', '2023-10-24 12:07:12', NULL, 1),
(610, '2023-10-24', '17:07:23', '2023-10-24 12:07:23', '2023-10-24 12:07:23', NULL, 7),
(611, '2023-10-24', '17:07:49', '2023-10-24 12:07:49', '2023-10-24 12:07:49', NULL, 8),
(612, '2023-10-24', '17:08:23', '2023-10-24 12:08:23', '2023-10-24 12:08:23', NULL, 10),
(623, '2023-10-24', '17:56:52', '2023-10-24 12:56:52', '2023-10-24 12:56:52', NULL, 1),
(624, '2023-10-24', '17:58:23', '2023-10-24 12:58:23', '2023-10-24 12:58:23', NULL, 7),
(625, '2023-10-24', '18:00:43', '2023-10-24 13:00:43', '2023-10-24 13:00:43', NULL, 8),
(626, '2023-10-24', '18:22:07', '2023-10-24 13:22:07', '2023-10-24 13:22:07', NULL, 1),
(627, '2023-10-24', '18:22:22', '2023-10-24 13:22:22', '2023-10-24 13:22:22', NULL, 7),
(628, '2023-10-24', '18:23:23', '2023-10-24 13:23:23', '2023-10-24 13:23:23', NULL, 8),
(629, '2023-10-25', '09:40:32', '2023-10-25 04:40:32', '2023-10-25 04:40:32', NULL, 1),
(630, '2023-10-25', '10:04:29', '2023-10-25 05:04:29', '2023-10-25 05:04:29', NULL, 7),
(631, '2023-10-25', '10:05:26', '2023-10-25 05:05:26', '2023-10-25 05:05:26', NULL, 8),
(635, '2023-10-25', '10:38:51', '2023-10-25 05:38:51', '2023-10-25 05:38:51', NULL, 10),
(636, '2023-10-25', '10:45:54', '2023-10-25 05:45:54', '2023-10-25 05:45:54', NULL, 1),
(637, '2023-10-25', '10:50:50', '2023-10-25 05:50:50', '2023-10-25 05:50:50', NULL, 7),
(638, '2023-10-25', '10:51:12', '2023-10-25 05:51:12', '2023-10-25 05:51:12', NULL, 8),
(639, '2023-10-25', '11:05:24', '2023-10-25 06:05:24', '2023-10-25 06:05:24', NULL, 1),
(640, '2023-10-25', '11:09:03', '2023-10-25 06:09:03', '2023-10-25 06:09:03', NULL, 7),
(641, '2023-10-25', '11:09:35', '2023-10-25 06:09:35', '2023-10-25 06:09:35', NULL, 8),
(642, '2023-10-25', '11:27:19', '2023-10-25 06:27:19', '2023-10-25 06:27:19', NULL, 1),
(643, '2023-10-25', '11:28:02', '2023-10-25 06:28:02', '2023-10-25 06:28:02', NULL, 7),
(644, '2023-10-25', '11:28:22', '2023-10-25 06:28:22', '2023-10-25 06:28:22', NULL, 8),
(648, '2023-10-25', '12:26:39', '2023-10-25 07:26:39', '2023-10-25 07:26:39', NULL, 10),
(651, '2023-10-25', '12:52:44', '2023-10-25 07:52:45', '2023-10-25 07:52:45', NULL, 1),
(652, '2023-10-25', '12:52:58', '2023-10-25 07:52:58', '2023-10-25 07:52:58', NULL, 7),
(653, '2023-10-25', '12:53:30', '2023-10-25 07:53:30', '2023-10-25 07:53:30', NULL, 8),
(654, '2023-10-25', '14:06:06', '2023-10-25 09:06:06', '2023-10-25 09:06:06', NULL, 1),
(655, '2023-10-25', '14:06:14', '2023-10-25 09:06:14', '2023-10-25 09:06:14', NULL, 1),
(656, '2023-10-25', '14:06:51', '2023-10-25 09:06:51', '2023-10-25 09:06:51', NULL, 1),
(657, '2023-10-25', '14:06:59', '2023-10-25 09:06:59', '2023-10-25 09:06:59', NULL, 1),
(658, '2023-10-25', '14:07:05', '2023-10-25 09:07:05', '2023-10-25 09:07:05', NULL, 1),
(659, '2023-10-25', '14:07:11', '2023-10-25 09:07:11', '2023-10-25 09:07:11', NULL, 1),
(660, '2023-10-25', '14:08:22', '2023-10-25 09:08:22', '2023-10-25 09:08:22', NULL, 1),
(661, '2023-10-25', '14:08:43', '2023-10-25 09:08:43', '2023-10-25 09:08:43', NULL, 7),
(662, '2023-10-25', '14:14:31', '2023-10-25 09:14:31', '2023-10-25 09:14:31', NULL, 7),
(663, '2023-10-25', '14:16:30', '2023-10-25 09:16:30', '2023-10-25 09:16:30', NULL, 1),
(664, '2023-10-25', '14:16:46', '2023-10-25 09:16:46', '2023-10-25 09:16:46', NULL, 7),
(665, '2023-10-25', '14:22:42', '2023-10-25 09:22:42', '2023-10-25 09:22:42', NULL, 8),
(666, '2023-10-25', '14:28:21', '2023-10-25 09:28:21', '2023-10-25 09:28:21', NULL, 8),
(667, '2023-10-25', '14:28:36', '2023-10-25 09:28:36', '2023-10-25 09:28:36', NULL, 8),
(668, '2023-10-25', '14:28:49', '2023-10-25 09:28:49', '2023-10-25 09:28:49', NULL, 8),
(669, '2023-10-25', '14:29:20', '2023-10-25 09:29:20', '2023-10-25 09:29:20', NULL, 1),
(670, '2023-10-25', '14:32:16', '2023-10-25 09:32:16', '2023-10-25 09:32:16', NULL, 7),
(671, '2023-10-25', '14:33:41', '2023-10-25 09:33:41', '2023-10-25 09:33:41', NULL, 8),
(672, '2023-10-25', '14:35:17', '2023-10-25 09:35:17', '2023-10-25 09:35:17', NULL, 10),
(679, '2023-10-25', '14:57:05', '2023-10-25 09:57:05', '2023-10-25 09:57:05', NULL, 1),
(681, '2023-10-25', '15:00:58', '2023-10-25 10:00:58', '2023-10-25 10:00:58', NULL, 7),
(682, '2023-10-25', '15:01:17', '2023-10-25 10:01:17', '2023-10-25 10:01:17', NULL, 8),
(683, '2023-10-25', '15:02:08', '2023-10-25 10:02:08', '2023-10-25 10:02:08', NULL, 10),
(684, '2023-10-25', '15:11:39', '2023-10-25 10:11:39', '2023-10-25 10:11:39', NULL, 1),
(685, '2023-10-25', '15:13:07', '2023-10-25 10:13:07', '2023-10-25 10:13:07', NULL, 7),
(686, '2023-10-25', '15:13:34', '2023-10-25 10:13:34', '2023-10-25 10:13:34', NULL, 8),
(687, '2023-10-25', '15:14:17', '2023-10-25 10:14:17', '2023-10-25 10:14:17', NULL, 10),
(688, '2023-10-25', '15:24:21', '2023-10-25 10:24:21', '2023-10-25 10:24:21', NULL, 1),
(689, '2023-10-25', '15:24:53', '2023-10-25 10:24:53', '2023-10-25 10:24:53', NULL, 7),
(690, '2023-10-25', '15:26:16', '2023-10-25 10:26:16', '2023-10-25 10:26:16', NULL, 1),
(691, '2023-10-25', '15:27:16', '2023-10-25 10:27:16', '2023-10-25 10:27:16', NULL, 8),
(692, '2023-10-25', '15:27:54', '2023-10-25 10:27:54', '2023-10-25 10:27:54', NULL, 10),
(693, '2023-10-25', '15:32:31', '2023-10-25 10:32:31', '2023-10-25 10:32:31', NULL, 1),
(694, '2023-10-25', '15:36:16', '2023-10-25 10:36:16', '2023-10-25 10:36:16', NULL, 1),
(695, '2023-10-25', '15:36:55', '2023-10-25 10:36:55', '2023-10-25 10:36:55', NULL, 7),
(696, '2023-10-25', '15:37:12', '2023-10-25 10:37:12', '2023-10-25 10:37:12', NULL, 8),
(697, '2023-10-25', '15:41:14', '2023-10-25 10:41:14', '2023-10-25 10:41:14', NULL, 1),
(698, '2023-10-25', '15:43:13', '2023-10-25 10:43:13', '2023-10-25 10:43:13', NULL, 7),
(699, '2023-10-25', '15:43:33', '2023-10-25 10:43:33', '2023-10-25 10:43:33', NULL, 8),
(701, '2023-10-25', '15:59:54', '2023-10-25 10:59:54', '2023-10-25 10:59:54', NULL, 10),
(711, '2023-10-25', '16:11:04', '2023-10-25 11:11:04', '2023-10-25 11:11:04', NULL, 1),
(712, '2023-10-25', '16:11:17', '2023-10-25 11:11:17', '2023-10-25 11:11:17', NULL, 7),
(713, '2023-10-25', '16:11:54', '2023-10-25 11:11:54', '2023-10-25 11:11:54', NULL, 8),
(714, '2023-10-25', '16:12:55', '2023-10-25 11:12:55', '2023-10-25 11:12:55', NULL, 10),
(717, '2023-10-25', '16:55:15', '2023-10-25 11:55:15', '2023-10-25 11:55:15', NULL, 7),
(718, '2023-10-25', '16:55:53', '2023-10-25 11:55:53', '2023-10-25 11:55:53', NULL, 8),
(719, '2023-10-25', '16:57:23', '2023-10-25 11:57:23', '2023-10-25 11:57:23', NULL, 10),
(725, '2023-10-25', '18:00:11', '2023-10-25 13:00:11', '2023-10-25 13:00:11', NULL, 1),
(726, '2023-10-25', '18:00:18', '2023-10-25 13:00:18', '2023-10-25 13:00:18', NULL, 7),
(727, '2023-10-25', '18:00:33', '2023-10-25 13:00:33', '2023-10-25 13:00:33', NULL, 8),
(728, '2023-10-25', '18:02:35', '2023-10-25 13:02:35', '2023-10-25 13:02:35', NULL, 10),
(734, '2023-10-25', '19:16:25', '2023-10-25 14:16:25', '2023-10-25 14:16:25', NULL, 7),
(747, '2023-10-26', '09:35:23', '2023-10-26 04:35:23', '2023-10-26 04:35:23', NULL, 1),
(753, '2023-10-26', '10:05:26', '2023-10-26 05:05:26', '2023-10-26 05:05:26', NULL, 7),
(754, '2023-10-26', '10:05:43', '2023-10-26 05:05:43', '2023-10-26 05:05:43', NULL, 8),
(755, '2023-10-26', '10:45:40', '2023-10-26 05:45:40', '2023-10-26 05:45:40', NULL, 10),
(756, '2023-10-26', '10:51:37', '2023-10-26 05:51:37', '2023-10-26 05:51:37', NULL, 1),
(757, '2023-10-26', '10:52:21', '2023-10-26 05:52:21', '2023-10-26 05:52:21', NULL, 7),
(758, '2023-10-26', '10:52:46', '2023-10-26 05:52:46', '2023-10-26 05:52:46', NULL, 8),
(759, '2023-10-26', '11:08:42', '2023-10-26 06:08:42', '2023-10-26 06:08:42', NULL, 7),
(760, '2023-10-26', '11:11:13', '2023-10-26 06:11:13', '2023-10-26 06:11:13', NULL, 7),
(761, '2023-10-26', '11:12:00', '2023-10-26 06:12:00', '2023-10-26 06:12:00', NULL, 7),
(762, '2023-10-26', '11:15:18', '2023-10-26 06:15:18', '2023-10-26 06:15:18', NULL, 1),
(763, '2023-10-26', '11:16:15', '2023-10-26 06:16:15', '2023-10-26 06:16:15', NULL, 7),
(764, '2023-10-26', '11:16:36', '2023-10-26 06:16:36', '2023-10-26 06:16:36', NULL, 8),
(765, '2023-10-26', '11:21:24', '2023-10-26 06:21:24', '2023-10-26 06:21:24', NULL, 1),
(766, '2023-10-26', '11:21:51', '2023-10-26 06:21:51', '2023-10-26 06:21:51', NULL, 7),
(767, '2023-10-26', '11:22:11', '2023-10-26 06:22:11', '2023-10-26 06:22:11', NULL, 8),
(768, '2023-10-26', '11:24:17', '2023-10-26 06:24:17', '2023-10-26 06:24:17', NULL, 1),
(769, '2023-10-26', '11:24:52', '2023-10-26 06:24:52', '2023-10-26 06:24:52', NULL, 7),
(772, '2023-10-26', '11:28:07', '2023-10-26 06:28:07', '2023-10-26 06:28:07', NULL, 8),
(773, '2023-10-26', '11:30:21', '2023-10-26 06:30:21', '2023-10-26 06:30:21', NULL, 1),
(774, '2023-10-26', '11:30:54', '2023-10-26 06:30:54', '2023-10-26 06:30:54', NULL, 7),
(775, '2023-10-26', '11:38:18', '2023-10-26 06:38:18', '2023-10-26 06:38:18', NULL, 8),
(776, '2023-10-26', '11:40:05', '2023-10-26 06:40:05', '2023-10-26 06:40:05', NULL, 1),
(777, '2023-10-26', '11:40:23', '2023-10-26 06:40:23', '2023-10-26 06:40:23', NULL, 7),
(779, '2023-10-26', '11:52:07', '2023-10-26 06:52:07', '2023-10-26 06:52:07', NULL, 1),
(780, '2023-10-26', '11:53:28', '2023-10-26 06:53:28', '2023-10-26 06:53:28', NULL, 7),
(781, '2023-10-26', '11:55:49', '2023-10-26 06:55:49', '2023-10-26 06:55:49', NULL, 8),
(782, '2023-10-26', '12:02:19', '2023-10-26 07:02:19', '2023-10-26 07:02:19', NULL, 1),
(783, '2023-10-26', '12:03:07', '2023-10-26 07:03:07', '2023-10-26 07:03:07', NULL, 7),
(784, '2023-10-26', '12:13:02', '2023-10-26 07:13:02', '2023-10-26 07:13:02', NULL, 1),
(785, '2023-10-26', '12:13:28', '2023-10-26 07:13:28', '2023-10-26 07:13:28', NULL, 7),
(786, '2023-10-26', '12:17:21', '2023-10-26 07:17:21', '2023-10-26 07:17:21', NULL, 8),
(787, '2023-10-26', '12:22:06', '2023-10-26 07:22:06', '2023-10-26 07:22:06', NULL, 8),
(788, '2023-10-26', '12:24:38', '2023-10-26 07:24:38', '2023-10-26 07:24:38', NULL, 1),
(789, '2023-10-26', '12:25:56', '2023-10-26 07:25:56', '2023-10-26 07:25:56', NULL, 7),
(790, '2023-10-26', '12:26:28', '2023-10-26 07:26:28', '2023-10-26 07:26:28', NULL, 8),
(792, '2023-10-26', '12:44:32', '2023-10-26 07:44:32', '2023-10-26 07:44:32', NULL, 1),
(793, '2023-10-26', '12:44:58', '2023-10-26 07:44:58', '2023-10-26 07:44:58', NULL, 7),
(794, '2023-10-26', '12:45:37', '2023-10-26 07:45:37', '2023-10-26 07:45:37', NULL, 8),
(799, '2023-10-26', '12:48:57', '2023-10-26 07:48:57', '2023-10-26 07:48:57', NULL, 10),
(801, '2023-10-26', '14:07:39', '2023-10-26 09:07:39', '2023-10-26 09:07:39', NULL, 1),
(802, '2023-10-26', '14:08:11', '2023-10-26 09:08:11', '2023-10-26 09:08:11', NULL, 7),
(803, '2023-10-26', '14:08:34', '2023-10-26 09:08:34', '2023-10-26 09:08:34', NULL, 8),
(804, '2023-10-26', '14:09:08', '2023-10-26 09:09:08', '2023-10-26 09:09:08', NULL, 10),
(820, '2023-10-26', '14:18:43', '2023-10-26 09:18:43', '2023-10-26 09:18:43', NULL, 10),
(821, '2023-10-26', '14:19:38', '2023-10-26 09:19:38', '2023-10-26 09:19:38', NULL, 1),
(822, '2023-10-26', '14:19:53', '2023-10-26 09:19:53', '2023-10-26 09:19:53', NULL, 7),
(823, '2023-10-26', '14:20:52', '2023-10-26 09:20:52', '2023-10-26 09:20:52', NULL, 8),
(824, '2023-10-26', '14:22:02', '2023-10-26 09:22:02', '2023-10-26 09:22:02', NULL, 10),
(840, '2023-10-26', '15:04:17', '2023-10-26 10:04:17', '2023-10-26 10:04:17', NULL, 1),
(841, '2023-10-26', '15:04:44', '2023-10-26 10:04:44', '2023-10-26 10:04:44', NULL, 7),
(842, '2023-10-26', '15:05:18', '2023-10-26 10:05:18', '2023-10-26 10:05:18', NULL, 8),
(849, '2023-10-26', '15:45:42', '2023-10-26 10:45:42', '2023-10-26 10:45:42', NULL, 10),
(850, '2023-10-26', '15:46:21', '2023-10-26 10:46:21', '2023-10-26 10:46:21', NULL, 10),
(851, '2023-10-26', '15:48:33', '2023-10-26 10:48:33', '2023-10-26 10:48:33', NULL, 10),
(852, '2023-10-26', '15:50:50', '2023-10-26 10:50:50', '2023-10-26 10:50:50', NULL, 10),
(860, '2023-10-26', '16:53:37', '2023-10-26 11:53:37', '2023-10-26 11:53:37', NULL, 1),
(861, '2023-10-26', '16:53:46', '2023-10-26 11:53:46', '2023-10-26 11:53:46', NULL, 1),
(862, '2023-10-26', '16:54:57', '2023-10-26 11:54:57', '2023-10-26 11:54:57', NULL, 1),
(863, '2023-10-26', '16:55:54', '2023-10-26 11:55:54', '2023-10-26 11:55:54', NULL, 7),
(864, '2023-10-26', '16:56:04', '2023-10-26 11:56:04', '2023-10-26 11:56:04', NULL, 1),
(865, '2023-10-26', '16:56:11', '2023-10-26 11:56:11', '2023-10-26 11:56:11', NULL, 8),
(866, '2023-10-26', '17:00:24', '2023-10-26 12:00:24', '2023-10-26 12:00:24', NULL, 10),
(867, '2023-10-26', '17:01:03', '2023-10-26 12:01:03', '2023-10-26 12:01:03', NULL, 7),
(868, '2023-10-26', '17:01:03', '2023-10-26 12:01:03', '2023-10-26 12:01:03', NULL, 7),
(869, '2023-10-26', '17:01:39', '2023-10-26 12:01:39', '2023-10-26 12:01:39', NULL, 7),
(870, '2023-10-26', '17:01:47', '2023-10-26 12:01:47', '2023-10-26 12:01:47', NULL, 7),
(871, '2023-10-26', '17:02:18', '2023-10-26 12:02:18', '2023-10-26 12:02:18', NULL, 8),
(872, '2023-10-26', '17:02:42', '2023-10-26 12:02:42', '2023-10-26 12:02:42', NULL, 8),
(874, '2023-10-26', '17:05:59', '2023-10-26 12:05:59', '2023-10-26 12:05:59', NULL, 10);
INSERT INTO `bookingHistories` (`id`, `date`, `time`, `createdAt`, `updatedAt`, `bookingId`, `bookingStatusId`) VALUES
(875, '2023-10-26', '17:08:36', '2023-10-26 12:08:36', '2023-10-26 12:08:36', NULL, 1),
(876, '2023-10-26', '17:09:04', '2023-10-26 12:09:04', '2023-10-26 12:09:04', NULL, 7),
(877, '2023-10-26', '17:09:21', '2023-10-26 12:09:21', '2023-10-26 12:09:21', NULL, 8),
(878, '2023-10-26', '17:10:04', '2023-10-26 12:10:04', '2023-10-26 12:10:04', NULL, 10),
(886, '2023-10-26', '17:18:38', '2023-10-26 12:18:38', '2023-10-26 12:18:38', NULL, 1),
(888, '2023-10-26', '17:21:05', '2023-10-26 12:21:05', '2023-10-26 12:21:05', NULL, 1),
(891, '2023-10-26', '17:24:06', '2023-10-26 12:24:06', '2023-10-26 12:24:06', NULL, 10),
(892, '2023-10-26', '17:24:14', '2023-10-26 12:24:14', '2023-10-26 12:24:14', NULL, 1),
(894, '2023-10-26', '17:25:45', '2023-10-26 12:25:45', '2023-10-26 12:25:45', NULL, 1),
(899, '2023-10-26', '17:46:16', '2023-10-26 12:46:16', '2023-10-26 12:46:16', NULL, 1),
(900, '2023-10-26', '17:46:43', '2023-10-26 12:46:43', '2023-10-26 12:46:43', NULL, 7),
(901, '2023-10-26', '17:47:59', '2023-10-26 12:47:59', '2023-10-26 12:47:59', NULL, 8),
(902, '2023-10-26', '17:48:43', '2023-10-26 12:48:43', '2023-10-26 12:48:43', NULL, 10),
(903, '2023-10-26', '17:50:58', '2023-10-26 12:50:58', '2023-10-26 12:50:58', NULL, 1),
(904, '2023-10-26', '17:51:41', '2023-10-26 12:51:41', '2023-10-26 12:51:41', NULL, 1),
(905, '2023-10-26', '17:51:48', '2023-10-26 12:51:48', '2023-10-26 12:51:48', NULL, 1),
(909, '2023-10-26', '17:53:51', '2023-10-26 12:53:51', '2023-10-26 12:53:51', NULL, 1),
(911, '2023-10-26', '17:55:40', '2023-10-26 12:55:40', '2023-10-26 12:55:40', NULL, 1),
(912, '2023-10-26', '17:57:20', '2023-10-26 12:57:20', '2023-10-26 12:57:20', NULL, 1),
(913, '2023-10-26', '17:57:45', '2023-10-26 12:57:45', '2023-10-26 12:57:45', NULL, 7),
(914, '2023-10-26', '17:57:55', '2023-10-26 12:57:55', '2023-10-26 12:57:55', NULL, 1),
(915, '2023-10-26', '17:58:02', '2023-10-26 12:58:02', '2023-10-26 12:58:02', NULL, 1),
(916, '2023-10-26', '17:58:05', '2023-10-26 12:58:05', '2023-10-26 12:58:05', NULL, 8),
(917, '2023-10-26', '17:58:07', '2023-10-26 12:58:07', '2023-10-26 12:58:07', NULL, 1),
(918, '2023-10-26', '17:58:42', '2023-10-26 12:58:42', '2023-10-26 12:58:42', NULL, 1),
(919, '2023-10-26', '17:59:02', '2023-10-26 12:59:02', '2023-10-26 12:59:02', NULL, 10),
(920, '2023-10-26', '17:59:14', '2023-10-26 12:59:14', '2023-10-26 12:59:14', NULL, 7),
(921, '2023-10-26', '17:59:32', '2023-10-26 12:59:32', '2023-10-26 12:59:32', NULL, 8),
(923, '2023-10-26', '18:00:33', '2023-10-26 13:00:33', '2023-10-26 13:00:33', NULL, 10),
(924, '2023-10-26', '18:00:46', '2023-10-26 13:00:46', '2023-10-26 13:00:46', NULL, 7),
(925, '2023-10-26', '18:01:19', '2023-10-26 13:01:19', '2023-10-26 13:01:19', NULL, 8),
(926, '2023-10-26', '18:03:52', '2023-10-26 13:03:52', '2023-10-26 13:03:52', NULL, 10),
(927, '2023-10-26', '18:04:51', '2023-10-26 13:04:51', '2023-10-26 13:04:51', NULL, 7),
(928, '2023-10-26', '18:04:51', '2023-10-26 13:04:51', '2023-10-26 13:04:51', NULL, 8),
(929, '2023-10-26', '18:04:51', '2023-10-26 13:04:51', '2023-10-26 13:04:51', NULL, 10),
(930, '2023-10-26', '18:05:01', '2023-10-26 13:05:01', '2023-10-26 13:05:01', NULL, 7),
(931, '2023-10-26', '18:05:01', '2023-10-26 13:05:01', '2023-10-26 13:05:01', NULL, 8),
(932, '2023-10-26', '18:05:01', '2023-10-26 13:05:01', '2023-10-26 13:05:01', NULL, 10),
(946, '2023-10-26', '18:23:28', '2023-10-26 13:23:28', '2023-10-26 13:23:28', NULL, 1),
(947, '2023-10-26', '18:24:12', '2023-10-26 13:24:12', '2023-10-26 13:24:12', NULL, 1),
(948, '2023-10-26', '18:24:35', '2023-10-26 13:24:35', '2023-10-26 13:24:35', NULL, 1),
(949, '2023-10-26', '18:26:11', '2023-10-26 13:26:11', '2023-10-26 13:26:11', NULL, 7),
(950, '2023-10-26', '18:26:21', '2023-10-26 13:26:21', '2023-10-26 13:26:21', NULL, 7),
(951, '2023-10-26', '18:26:34', '2023-10-26 13:26:34', '2023-10-26 13:26:34', NULL, 7),
(952, '2023-10-26', '18:27:22', '2023-10-26 13:27:22', '2023-10-26 13:27:22', NULL, 1),
(953, '2023-10-26', '18:28:42', '2023-10-26 13:28:42', '2023-10-26 13:28:42', NULL, 8),
(954, '2023-10-26', '18:29:08', '2023-10-26 13:29:08', '2023-10-26 13:29:08', NULL, 8),
(955, '2023-10-26', '18:29:37', '2023-10-26 13:29:37', '2023-10-26 13:29:37', NULL, 1),
(956, '2023-10-26', '18:29:39', '2023-10-26 13:29:39', '2023-10-26 13:29:39', NULL, 8),
(957, '2023-10-26', '18:29:39', '2023-10-26 13:29:39', '2023-10-26 13:29:39', NULL, 1),
(958, '2023-10-26', '18:29:51', '2023-10-26 13:29:51', '2023-10-26 13:29:51', NULL, 8),
(959, '2023-10-26', '18:30:02', '2023-10-26 13:30:02', '2023-10-26 13:30:02', NULL, 1),
(960, '2023-10-26', '18:30:08', '2023-10-26 13:30:08', '2023-10-26 13:30:08', NULL, 1),
(961, '2023-10-26', '18:30:45', '2023-10-26 13:30:45', '2023-10-26 13:30:45', NULL, 8),
(962, '2023-10-26', '18:30:57', '2023-10-26 13:30:57', '2023-10-26 13:30:57', NULL, 8),
(963, '2023-10-26', '18:31:48', '2023-10-26 13:31:48', '2023-10-26 13:31:48', NULL, 1),
(964, '2023-10-26', '18:31:57', '2023-10-26 13:31:57', '2023-10-26 13:31:57', NULL, 8),
(965, '2023-10-26', '18:32:46', '2023-10-26 13:32:46', '2023-10-26 13:32:46', NULL, 10),
(966, '2023-10-26', '18:33:34', '2023-10-26 13:33:34', '2023-10-26 13:33:34', NULL, 10),
(967, '2023-10-26', '18:33:36', '2023-10-26 13:33:36', '2023-10-26 13:33:36', NULL, 7),
(968, '2023-10-26', '18:34:07', '2023-10-26 13:34:07', '2023-10-26 13:34:07', NULL, 8),
(969, '2023-10-26', '18:34:09', '2023-10-26 13:34:09', '2023-10-26 13:34:09', NULL, 10),
(970, '2023-10-26', '18:34:19', '2023-10-26 13:34:19', '2023-10-26 13:34:19', NULL, 7),
(971, '2023-10-26', '18:35:07', '2023-10-26 13:35:07', '2023-10-26 13:35:07', NULL, 8),
(974, '2023-10-26', '18:36:20', '2023-10-26 13:36:20', '2023-10-26 13:36:20', NULL, 1),
(975, '2023-10-26', '18:37:10', '2023-10-26 13:37:10', '2023-10-26 13:37:10', NULL, 1),
(976, '2023-10-26', '18:39:01', '2023-10-26 13:39:01', '2023-10-26 13:39:01', NULL, 10),
(977, '2023-10-26', '18:40:08', '2023-10-26 13:40:08', '2023-10-26 13:40:08', NULL, 10),
(979, '2023-10-26', '18:43:03', '2023-10-26 13:43:03', '2023-10-26 13:43:03', NULL, 7),
(982, '2023-10-26', '18:51:02', '2023-10-26 13:51:02', '2023-10-26 13:51:02', NULL, 1),
(983, '2023-10-26', '18:51:30', '2023-10-26 13:51:30', '2023-10-26 13:51:30', NULL, 7),
(984, '2023-10-26', '18:51:49', '2023-10-26 13:51:49', '2023-10-26 13:51:49', NULL, 8),
(985, '2023-10-26', '18:52:53', '2023-10-26 13:52:53', '2023-10-26 13:52:53', NULL, 1),
(986, '2023-10-26', '18:53:10', '2023-10-26 13:53:10', '2023-10-26 13:53:10', NULL, 7),
(987, '2023-10-26', '18:53:43', '2023-10-26 13:53:43', '2023-10-26 13:53:43', NULL, 8),
(988, '2023-10-26', '18:54:18', '2023-10-26 13:54:18', '2023-10-26 13:54:18', NULL, 10),
(990, '2023-10-26', '18:55:04', '2023-10-26 13:55:04', '2023-10-26 13:55:04', NULL, 10),
(991, '2023-10-27', '10:28:11', '2023-10-27 05:28:11', '2023-10-27 05:28:11', NULL, 1),
(992, '2023-10-27', '10:45:18', '2023-10-27 05:45:18', '2023-10-27 05:45:18', NULL, 1),
(994, '2023-10-27', '10:46:46', '2023-10-27 05:46:46', '2023-10-27 05:46:46', NULL, 1),
(996, '2023-10-27', '10:48:24', '2023-10-27 05:48:24', '2023-10-27 05:48:24', NULL, 1),
(997, '2023-10-27', '10:53:10', '2023-10-27 05:53:10', '2023-10-27 05:53:10', NULL, 7),
(998, '2023-10-27', '10:53:26', '2023-10-27 05:53:26', '2023-10-27 05:53:26', NULL, 7),
(999, '2023-10-27', '10:53:36', '2023-10-27 05:53:36', '2023-10-27 05:53:36', NULL, 7),
(1000, '2023-10-27', '10:54:04', '2023-10-27 05:54:04', '2023-10-27 05:54:04', NULL, 8),
(1001, '2023-10-27', '10:58:44', '2023-10-27 05:58:44', '2023-10-27 05:58:44', NULL, 8),
(1002, '2023-10-27', '11:02:50', '2023-10-27 06:02:50', '2023-10-27 06:02:50', NULL, 8),
(1003, '2023-10-27', '11:06:11', '2023-10-27 06:06:11', '2023-10-27 06:06:11', NULL, 10),
(1004, '2023-10-27', '11:06:45', '2023-10-27 06:06:45', '2023-10-27 06:06:45', NULL, 8),
(1005, '2023-10-27', '11:09:29', '2023-10-27 06:09:29', '2023-10-27 06:09:29', NULL, 8),
(1006, '2023-10-27', '11:10:42', '2023-10-27 06:10:42', '2023-10-27 06:10:42', NULL, 8),
(1007, '2023-10-27', '11:11:07', '2023-10-27 06:11:07', '2023-10-27 06:11:07', NULL, 10),
(1012, '2023-10-27', '11:22:27', '2023-10-27 06:22:27', '2023-10-27 06:22:27', NULL, 1),
(1013, '2023-10-27', '11:22:40', '2023-10-27 06:22:40', '2023-10-27 06:22:40', NULL, 7),
(1014, '2023-10-27', '11:22:56', '2023-10-27 06:22:56', '2023-10-27 06:22:56', NULL, 8),
(1015, '2023-10-27', '11:24:13', '2023-10-27 06:24:13', '2023-10-27 06:24:13', NULL, 10),
(1016, '2023-10-27', '11:28:08', '2023-10-27 06:28:08', '2023-10-27 06:28:08', NULL, 1),
(1017, '2023-10-27', '11:29:53', '2023-10-27 06:29:53', '2023-10-27 06:29:53', NULL, 7),
(1018, '2023-10-27', '11:30:12', '2023-10-27 06:30:12', '2023-10-27 06:30:12', NULL, 8),
(1019, '2023-10-27', '11:33:58', '2023-10-27 06:33:58', '2023-10-27 06:33:58', NULL, 10),
(1023, '2023-10-27', '11:37:05', '2023-10-27 06:37:05', '2023-10-27 06:37:05', NULL, 1),
(1024, '2023-10-27', '11:37:23', '2023-10-27 06:37:23', '2023-10-27 06:37:23', NULL, 7),
(1025, '2023-10-27', '11:37:45', '2023-10-27 06:37:45', '2023-10-27 06:37:45', NULL, 8),
(1026, '2023-10-27', '11:39:31', '2023-10-27 06:39:31', '2023-10-27 06:39:31', NULL, 10),
(1027, '2023-10-27', '11:42:41', '2023-10-27 06:42:41', '2023-10-27 06:42:41', NULL, 1),
(1028, '2023-10-27', '11:43:04', '2023-10-27 06:43:04', '2023-10-27 06:43:04', NULL, 7),
(1029, '2023-10-27', '11:43:44', '2023-10-27 06:43:44', '2023-10-27 06:43:44', NULL, 8),
(1030, '2023-10-27', '11:47:55', '2023-10-27 06:47:55', '2023-10-27 06:47:55', NULL, 10),
(1040, '2023-10-27', '12:14:10', '2023-10-27 07:14:10', '2023-10-27 07:14:10', NULL, 7),
(1041, '2023-10-27', '12:14:27', '2023-10-27 07:14:27', '2023-10-27 07:14:27', NULL, 8),
(1042, '2023-10-27', '12:32:34', '2023-10-27 07:32:34', '2023-10-27 07:32:34', NULL, 8),
(1043, '2023-10-27', '12:42:03', '2023-10-27 07:42:03', '2023-10-27 07:42:03', NULL, 1),
(1044, '2023-10-27', '12:42:15', '2023-10-27 07:42:15', '2023-10-27 07:42:15', NULL, 7),
(1045, '2023-10-27', '12:43:13', '2023-10-27 07:43:13', '2023-10-27 07:43:13', NULL, 8),
(1046, '2023-10-27', '12:46:28', '2023-10-27 07:46:28', '2023-10-27 07:46:28', NULL, 1),
(1047, '2023-10-27', '12:47:01', '2023-10-27 07:47:01', '2023-10-27 07:47:01', NULL, 7),
(1048, '2023-10-27', '12:47:22', '2023-10-27 07:47:22', '2023-10-27 07:47:22', NULL, 8),
(1049, '2023-10-27', '12:51:24', '2023-10-27 07:51:24', '2023-10-27 07:51:24', NULL, 1),
(1050, '2023-10-27', '12:52:54', '2023-10-27 07:52:54', '2023-10-27 07:52:54', NULL, 7),
(1051, '2023-10-27', '12:53:10', '2023-10-27 07:53:10', '2023-10-27 07:53:10', NULL, 8),
(1052, '2023-10-27', '13:05:29', '2023-10-27 08:05:29', '2023-10-27 08:05:29', NULL, 1),
(1053, '2023-10-27', '13:05:37', '2023-10-27 08:05:37', '2023-10-27 08:05:37', NULL, 7),
(1054, '2023-10-27', '13:05:52', '2023-10-27 08:05:52', '2023-10-27 08:05:52', NULL, 8),
(1055, '2023-10-27', '13:06:39', '2023-10-27 08:06:39', '2023-10-27 08:06:39', NULL, 10),
(1061, '2023-10-27', '15:53:41', '2023-10-27 10:53:41', '2023-10-27 10:53:41', NULL, 10),
(1062, '2023-10-27', '15:58:02', '2023-10-27 10:58:02', '2023-10-27 10:58:02', NULL, 1),
(1063, '2023-10-27', '16:04:15', '2023-10-27 11:04:15', '2023-10-27 11:04:15', NULL, 7),
(1064, '2023-10-27', '16:04:35', '2023-10-27 11:04:35', '2023-10-27 11:04:35', NULL, 8),
(1065, '2023-10-27', '16:06:42', '2023-10-27 11:06:42', '2023-10-27 11:06:42', NULL, 10),
(1073, '2023-10-27', '16:18:21', '2023-10-27 11:18:21', '2023-10-27 11:18:21', NULL, 1),
(1074, '2023-10-27', '16:18:49', '2023-10-27 11:18:49', '2023-10-27 11:18:49', NULL, 7),
(1075, '2023-10-27', '16:19:17', '2023-10-27 11:19:17', '2023-10-27 11:19:17', NULL, 8),
(1076, '2023-10-27', '16:21:58', '2023-10-27 11:21:58', '2023-10-27 11:21:58', NULL, 10),
(1081, '2023-10-27', '16:39:43', '2023-10-27 11:39:43', '2023-10-27 11:39:43', NULL, 1),
(1082, '2023-10-27', '16:39:57', '2023-10-27 11:39:57', '2023-10-27 11:39:57', NULL, 7),
(1083, '2023-10-27', '16:40:25', '2023-10-27 11:40:25', '2023-10-27 11:40:25', NULL, 8),
(1084, '2023-10-27', '16:41:11', '2023-10-27 11:41:11', '2023-10-27 11:41:11', NULL, 10),
(1092, '2023-10-27', '18:04:47', '2023-10-27 13:04:47', '2023-10-27 13:04:47', NULL, 1),
(1093, '2023-10-27', '18:08:13', '2023-10-27 13:08:13', '2023-10-27 13:08:13', NULL, 1),
(1094, '2023-10-27', '18:09:31', '2023-10-27 13:09:31', '2023-10-27 13:09:31', NULL, 7),
(1095, '2023-10-27', '18:09:52', '2023-10-27 13:09:52', '2023-10-27 13:09:52', NULL, 8),
(1096, '2023-10-27', '18:09:58', '2023-10-27 13:09:58', '2023-10-27 13:09:58', NULL, 1),
(1097, '2023-10-27', '18:10:55', '2023-10-27 13:10:55', '2023-10-27 13:10:55', NULL, 10),
(1099, '2023-10-27', '18:12:11', '2023-10-27 13:12:11', '2023-10-27 13:12:11', NULL, 1),
(1101, '2023-10-27', '18:13:27', '2023-10-27 13:13:27', '2023-10-27 13:13:27', NULL, 7),
(1102, '2023-10-27', '18:13:34', '2023-10-27 13:13:34', '2023-10-27 13:13:34', NULL, 7),
(1103, '2023-10-27', '18:13:56', '2023-10-27 13:13:56', '2023-10-27 13:13:56', NULL, 8),
(1106, '2023-10-27', '18:16:13', '2023-10-27 13:16:13', '2023-10-27 13:16:13', NULL, 10),
(1114, '2023-10-27', '18:23:49', '2023-10-27 13:23:49', '2023-10-27 13:23:49', NULL, 7),
(1115, '2023-10-27', '18:24:08', '2023-10-27 13:24:08', '2023-10-27 13:24:08', NULL, 8),
(1116, '2023-10-27', '18:24:48', '2023-10-27 13:24:48', '2023-10-27 13:24:48', NULL, 10),
(1120, '2023-10-27', '18:30:25', '2023-10-27 13:30:25', '2023-10-27 13:30:25', NULL, 1),
(1121, '2023-10-27', '18:30:50', '2023-10-27 13:30:50', '2023-10-27 13:30:50', NULL, 7),
(1123, '2023-10-27', '18:31:03', '2023-10-27 13:31:03', '2023-10-27 13:31:03', NULL, 8),
(1127, '2023-10-27', '18:34:58', '2023-10-27 13:34:58', '2023-10-27 13:34:58', NULL, 10),
(1150, '2023-10-30', '11:20:51', '2023-10-30 06:20:51', '2023-10-30 06:20:51', NULL, 1),
(1151, '2023-10-30', '11:22:35', '2023-10-30 06:22:35', '2023-10-30 06:22:35', NULL, 1),
(1152, '2023-10-30', '11:22:39', '2023-10-30 06:22:39', '2023-10-30 06:22:39', NULL, 1),
(1154, '2023-10-30', '11:27:42', '2023-10-30 06:27:42', '2023-10-30 06:27:42', NULL, 1),
(1158, '2023-10-30', '11:57:09', '2023-10-30 06:57:09', '2023-10-30 06:57:09', NULL, 7),
(1159, '2023-10-30', '11:57:38', '2023-10-30 06:57:38', '2023-10-30 06:57:38', NULL, 8),
(1160, '2023-10-30', '11:59:29', '2023-10-30 06:59:29', '2023-10-30 06:59:29', NULL, 10),
(1210, '2023-10-30', '17:32:10', '2023-10-30 12:32:10', '2023-10-30 12:32:10', NULL, 1),
(1211, '2023-10-30', '19:04:50', '2023-10-30 14:04:50', '2023-10-30 14:04:50', NULL, 1),
(1225, '2023-10-31', '12:22:33', '2023-10-31 07:22:33', '2023-10-31 07:22:33', NULL, 7),
(1226, '2023-10-31', '12:22:33', '2023-10-31 07:22:33', '2023-10-31 07:22:33', NULL, 8),
(1227, '2023-10-31', '12:22:33', '2023-10-31 07:22:33', '2023-10-31 07:22:33', NULL, 10),
(1232, '2023-10-31', '12:24:16', '2023-10-31 07:24:16', '2023-10-31 07:24:16', NULL, 7),
(1233, '2023-10-31', '12:24:16', '2023-10-31 07:24:16', '2023-10-31 07:24:16', NULL, 8),
(1234, '2023-10-31', '12:24:16', '2023-10-31 07:24:16', '2023-10-31 07:24:16', NULL, 10),
(1235, '2023-10-31', '12:24:44', '2023-10-31 07:24:44', '2023-10-31 07:24:44', NULL, 7),
(1236, '2023-10-31', '12:24:44', '2023-10-31 07:24:44', '2023-10-31 07:24:44', NULL, 8),
(1237, '2023-10-31', '12:24:44', '2023-10-31 07:24:44', '2023-10-31 07:24:44', NULL, 10),
(1238, '2023-10-31', '12:25:45', '2023-10-31 07:25:45', '2023-10-31 07:25:45', NULL, 7),
(1239, '2023-10-31', '12:25:45', '2023-10-31 07:25:45', '2023-10-31 07:25:45', NULL, 8),
(1240, '2023-10-31', '12:25:45', '2023-10-31 07:25:45', '2023-10-31 07:25:45', NULL, 10),
(1241, '2023-10-31', '12:26:22', '2023-10-31 07:26:22', '2023-10-31 07:26:22', NULL, 7),
(1242, '2023-10-31', '12:26:22', '2023-10-31 07:26:22', '2023-10-31 07:26:22', NULL, 8),
(1243, '2023-10-31', '12:26:22', '2023-10-31 07:26:22', '2023-10-31 07:26:22', NULL, 10),
(1263, '2023-10-31', '14:45:28', '2023-10-31 09:45:28', '2023-10-31 09:45:28', NULL, 7),
(1264, '2023-10-31', '14:45:46', '2023-10-31 09:45:46', '2023-10-31 09:45:46', NULL, 8),
(1271, '2023-10-31', '15:26:59', '2023-10-31 10:26:59', '2023-10-31 10:26:59', NULL, 1),
(1272, '2023-10-31', '15:28:03', '2023-10-31 10:28:03', '2023-10-31 10:28:03', 290, 1),
(1273, '2023-10-31', '15:31:15', '2023-10-31 10:31:15', '2023-10-31 10:31:15', 291, 1),
(1274, '2023-10-31', '15:32:48', '2023-10-31 10:32:48', '2023-10-31 10:32:48', NULL, 7),
(1275, '2023-10-31', '15:33:03', '2023-10-31 10:33:03', '2023-10-31 10:33:03', NULL, 8),
(1276, '2023-10-31', '15:33:13', '2023-10-31 10:33:13', '2023-10-31 10:33:13', 290, 7),
(1277, '2023-10-31', '15:33:44', '2023-10-31 10:33:44', '2023-10-31 10:33:44', 290, 8),
(1278, '2023-10-31', '15:33:57', '2023-10-31 10:33:57', '2023-10-31 10:33:57', 291, 7),
(1279, '2023-10-31', '15:34:15', '2023-10-31 10:34:15', '2023-10-31 10:34:15', 291, 8),
(1282, '2023-10-31', '16:09:28', '2023-10-31 11:09:28', '2023-10-31 11:09:28', NULL, 10),
(1283, '2023-10-31', '16:12:41', '2023-10-31 11:12:41', '2023-10-31 11:12:41', 291, 10),
(1284, '2023-10-31', '16:14:20', '2023-10-31 11:14:20', '2023-10-31 11:14:20', NULL, 10),
(1289, '2023-10-31', '16:26:57', '2023-10-31 11:26:57', '2023-10-31 11:26:57', NULL, 7),
(1290, '2023-10-31', '16:27:38', '2023-10-31 11:27:38', '2023-10-31 11:27:38', NULL, 8),
(1294, '2023-10-31', '16:45:54', '2023-10-31 11:45:54', '2023-10-31 11:45:54', 290, 10),
(1295, '2023-10-31', '17:55:17', '2023-10-31 12:55:17', '2023-10-31 12:55:17', NULL, 16),
(1296, '2023-10-31', '18:01:08', '2023-10-31 13:01:08', '2023-10-31 13:01:08', 291, 14),
(1297, '2023-10-31', '18:03:54', '2023-10-31 13:03:54', '2023-10-31 13:03:54', 290, 14),
(1298, '2023-10-31', '18:07:25', '2023-10-31 13:07:25', '2023-10-31 13:07:25', 292, 1),
(1299, '2023-10-31', '18:07:38', '2023-10-31 13:07:38', '2023-10-31 13:07:38', 292, 7),
(1300, '2023-10-31', '18:07:52', '2023-10-31 13:07:52', '2023-10-31 13:07:52', 292, 8),
(1301, '2023-10-31', '18:08:32', '2023-10-31 13:08:32', '2023-10-31 13:08:32', 292, 10),
(1302, '2023-10-31', '18:08:53', '2023-10-31 13:08:53', '2023-10-31 13:08:53', 292, 11),
(1303, '2023-10-31', '18:09:58', '2023-10-31 13:09:58', '2023-10-31 13:09:58', 292, 12),
(1304, '2023-10-31', '18:10:53', '2023-10-31 13:10:53', '2023-10-31 13:10:53', 293, 1),
(1305, '2023-10-31', '18:11:16', '2023-10-31 13:11:16', '2023-10-31 13:11:16', 293, 7),
(1306, '2023-10-31', '18:11:27', '2023-10-31 13:11:27', '2023-10-31 13:11:27', 293, 8),
(1307, '2023-10-31', '18:13:48', '2023-10-31 13:13:48', '2023-10-31 13:13:48', 293, 10),
(1308, '2023-10-31', '18:14:47', '2023-10-31 13:14:47', '2023-10-31 13:14:47', 293, 14),
(1309, '2023-10-31', '18:22:07', '2023-10-31 13:22:07', '2023-10-31 13:22:07', 293, 18),
(1310, '2023-11-01', '09:57:24', '2023-11-01 04:57:24', '2023-11-01 04:57:24', 290, 18);

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `trackingId` varchar(255) DEFAULT 'TSH-default-1000',
  `pickupDate` date DEFAULT NULL,
  `pickupStartTime` time DEFAULT NULL,
  `pickupEndTime` time DEFAULT NULL,
  `dropoffDate` date DEFAULT NULL,
  `dropoffStartTime` time DEFAULT NULL,
  `dropoffEndTime` time DEFAULT NULL,
  `instruction` varchar(255) DEFAULT '',
  `receiverEmail` varchar(255) DEFAULT '',
  `receiverPhone` varchar(255) DEFAULT '',
  `receiverName` varchar(255) DEFAULT '',
  `senderEmail` varchar(255) DEFAULT '',
  `senderPhone` varchar(255) DEFAULT '',
  `senderName` varchar(255) DEFAULT '',
  `subTotal` decimal(10,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) DEFAULT '0.00',
  `status` tinyint(1) DEFAULT '0',
  `paymentConfirmed` tinyint(1) DEFAULT '0',
  `scheduleSetBy` varchar(255) DEFAULT '',
  `ETA` date DEFAULT NULL,
  `weight` decimal(8,2) DEFAULT '0.00',
  `length` decimal(8,2) DEFAULT '0.00',
  `width` decimal(8,2) DEFAULT '0.00',
  `height` decimal(8,2) DEFAULT '0.00',
  `volume` decimal(8,2) DEFAULT '0.00',
  `distance` decimal(8,2) DEFAULT '0.00',
  `driverStatus` varchar(255) DEFAULT '',
  `deliveredAt` time DEFAULT NULL,
  `deliveredAtPickup` time DEFAULT NULL,
  `rated` varchar(255) DEFAULT 'pending',
  `barcode` varchar(1024) DEFAULT '',
  `signatureImage` varchar(1024) DEFAULT '',
  `paypalOrderId` varchar(255) DEFAULT NULL,
  `paymentBy` varchar(255) DEFAULT NULL,
  `captureId` varchar(255) DEFAULT NULL,
  `catText` varchar(255) DEFAULT NULL,
  `consolidation` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `logisticCompanyTrackingNum` varchar(1024) DEFAULT NULL,
  `pickupAddressId` int(11) DEFAULT NULL,
  `dropoffAddressId` int(11) DEFAULT NULL,
  `appUnitId` int(11) DEFAULT NULL,
  `bookingStatusId` int(11) DEFAULT NULL,
  `bookingTypeId` int(11) DEFAULT NULL,
  `couponId` int(11) DEFAULT NULL,
  `deliveryTypeId` int(11) DEFAULT NULL,
  `logisticCompanyId` int(11) DEFAULT NULL,
  `shipmentTypeId` int(11) DEFAULT NULL,
  `customerId` int(11) DEFAULT NULL,
  `receivingDriverId` int(11) DEFAULT NULL,
  `deliveryDriverId` int(11) DEFAULT NULL,
  `transporterId` int(11) DEFAULT NULL,
  `vehicleTypeId` int(11) DEFAULT NULL,
  `receivingWarehouseId` int(11) DEFAULT NULL,
  `deliveryWarehouseId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `trackingId`, `pickupDate`, `pickupStartTime`, `pickupEndTime`, `dropoffDate`, `dropoffStartTime`, `dropoffEndTime`, `instruction`, `receiverEmail`, `receiverPhone`, `receiverName`, `senderEmail`, `senderPhone`, `senderName`, `subTotal`, `discount`, `total`, `status`, `paymentConfirmed`, `scheduleSetBy`, `ETA`, `weight`, `length`, `width`, `height`, `volume`, `distance`, `driverStatus`, `deliveredAt`, `deliveredAtPickup`, `rated`, `barcode`, `signatureImage`, `paypalOrderId`, `paymentBy`, `captureId`, `catText`, `consolidation`, `createdAt`, `updatedAt`, `logisticCompanyTrackingNum`, `pickupAddressId`, `dropoffAddressId`, `appUnitId`, `bookingStatusId`, `bookingTypeId`, `couponId`, `deliveryTypeId`, `logisticCompanyId`, `shipmentTypeId`, `customerId`, `receivingDriverId`, `deliveryDriverId`, `transporterId`, `vehicleTypeId`, `receivingWarehouseId`, `deliveryWarehouseId`) VALUES
(290, 'TSH-290-518283', NULL, NULL, NULL, NULL, NULL, NULL, '', 'abc@gmail.com', '+106686868868', 'bubj', 'sigitesting5@gmail.com', '+50751243454646', 'Kiran testing', 200.00, 0.00, 200.00, 1, 1, '', NULL, 13.00, 0.00, 0.00, 0.00, 0.00, 0.00, '', NULL, NULL, 'pending', 'Public/Barcodes/TSH-290-518283.png', '', NULL, NULL, NULL, NULL, 0, '2023-10-31 10:28:03', '2023-11-01 04:57:24', NULL, 1, 51, 1, 18, 1, NULL, 1, 1, 1, 32, NULL, NULL, NULL, NULL, 2, NULL),
(291, 'TSH-291-705332', NULL, NULL, NULL, NULL, NULL, NULL, '', 'abc@gmail.com', '+149499494949', 'hjhh', 'sigitesting5@gmail.com', '+50751243454646', 'Kiran testing', 45.00, 0.00, 45.00, 1, 1, '', NULL, 1500.00, 12.00, 23.00, 34.00, 9384.00, 0.00, '', NULL, NULL, 'pending', 'Public/Barcodes/TSH-291-705332.png', '', NULL, NULL, NULL, NULL, 1, '2023-10-31 10:31:15', '2023-10-31 13:01:08', NULL, 1, 51, 1, 10, 1, NULL, 1, 1, 1, 32, NULL, NULL, NULL, NULL, 2, NULL),
(292, 'TSH-292-259420', NULL, NULL, NULL, NULL, NULL, NULL, '', 'bb@gmail.com', '+178484848846', 'hkhh', 'danish@gmail.com', '+50768686886866', 'Danish Ali', 200.00, 0.00, 200.00, 1, 1, '', NULL, 6.00, 0.00, 0.00, 0.00, 0.00, 0.00, '', NULL, NULL, 'pending', 'Public/Barcodes/TSH-292-259420.png', '', NULL, NULL, NULL, NULL, 0, '2023-10-31 13:07:25', '2023-10-31 13:09:58', NULL, 1, 52, 1, 12, 1, NULL, 1, 1, NULL, 32, NULL, NULL, NULL, NULL, 2, 3),
(293, 'TSH-293-158565', NULL, NULL, NULL, NULL, NULL, NULL, '', 'abc@gmail.com', '+186655656656', 'ivjvjg', 'danish@gmail.com', '+50768686886866', 'Danish Ali', 45.00, 0.00, 45.00, 1, 1, '', NULL, 9.00, 0.00, 0.00, 0.00, 0.00, 0.00, '', NULL, NULL, 'pending', 'Public/Barcodes/TSH-293-158565.png', '', NULL, NULL, NULL, NULL, 0, '2023-10-31 13:10:53', '2023-10-31 13:22:07', NULL, 1, 52, 1, 18, 1, NULL, 1, 1, NULL, 32, NULL, NULL, NULL, NULL, 2, 3);

-- --------------------------------------------------------

--
-- Table structure for table `bookingStatuses`
--

CREATE TABLE `bookingStatuses` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `description` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `bookingStatuses`
--

INSERT INTO `bookingStatuses` (`id`, `title`, `description`, `createdAt`, `updatedAt`) VALUES
(1, 'Order Created\r\n', 'Your order has been \r\ncreated', '2023-09-26 07:55:31', '2023-09-26 07:55:31'),
(7, 'Received at Warehouse (USA warehouse)\r\n', 'Confirmation of order received by warehouse', '2023-09-26 07:56:14', '2023-09-26 07:56:14'),
(8, 'Re measurements/Labeled', 'Confirmation of re-measurements and labeling of package(s)', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(10, 'Ready to Ship\r\n', 'Order ready to be deliver to customer directly or indirectly', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(11, 'In Transit\r\n', 'Package in Transit', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(12, 'Outgoing /Received\r\n', 'when Transit received in Puerto Rico warehouse package will be in received', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(13, 'Driver Assigned/Accepted\r\n', 'Hang on! Your Order is arriving soon', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(14, 'Shipped', 'Order shipped directly to customer from usa warehouse via logistic company', '2023-10-25 11:24:02', '2023-10-25 11:24:02'),
(15, 'Reached (delivery)\r\n', 'Driver Reached at Wearhouse', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(16, 'Pickedup (delivery)\r\n', 'Order has been picked by customer/driver ', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(17, 'Ongoing/ Start ride\r\n', 'On the way', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(18, 'Delivered\r\n', 'Your order has been completed', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(19, 'Cancelled\r\n', 'Order has been cancelled ', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(20, 'Awaiting self pickup\r\n', 'Awaiting customer to pickup order from warehouse', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(21, 'Handed over to customer\r\n', 'Order picked by customer from warehouse', '2023-09-26 07:57:40', '2023-09-26 07:57:40'),
(22, 'Hand over to Driver', 'hand over to delivery Driver', '2023-10-30 07:54:56', '2023-10-30 07:54:56');

-- --------------------------------------------------------

--
-- Table structure for table `bookingTypes`
--

CREATE TABLE `bookingTypes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `description` varchar(255) DEFAULT '',
  `image` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `bookingTypes`
--

INSERT INTO `bookingTypes` (`id`, `title`, `description`, `image`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'International Shipping', 'Get your parcel delivered at Puerto Rico from USA', 'public/International Shipping.png', 1, '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(2, 'Shipping\nCalculator', 'Calculate your shipping charges for Puerto Rico', 'public/ShippingCalculator.png', 1, '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(3, 'Send one package', 'Ship a single package to a single address. Our simplest option!', 'public/singlePackage.png', 2, '2023-10-04 11:07:03', '2023-10-04 11:07:03'),
(4, 'Send multiple packages to one address at the same time', 'Combine the box weights but not the boxes. Only available with select carriers', 'public/multiplePackages.png', 2, '2023-10-04 11:07:03', '2023-10-04 11:07:03'),
(5, 'Consolidate multiple packages into one box and save big!', 'Have us combine your packages into one box and save up to 80 % on shipping!', 'Public/consolidation.png', 2, '2023-10-04 11:07:03', '2023-10-04 11:07:03');

-- --------------------------------------------------------

--
-- Table structure for table `cancelledBookings`
--

CREATE TABLE `cancelledBookings` (
  `id` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `reasontext` varchar(255) DEFAULT NULL,
  `bookingId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `reasonId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `cancelledBookings`
--

INSERT INTO `cancelledBookings` (`id`, `createdAt`, `updatedAt`, `reasontext`, `bookingId`, `userId`, `reasonId`) VALUES
(11, '2023-10-12 05:09:15', '2023-10-12 05:09:15', 'custom tex', NULL, NULL, 10),
(12, '2023-10-12 05:25:27', '2023-10-12 05:25:27', 'I am testing ', NULL, NULL, 10),
(13, '2023-10-12 05:26:49', '2023-10-12 05:26:49', 'I am testing ', NULL, NULL, 10),
(14, '2023-10-12 05:31:15', '2023-10-12 05:31:15', 'test3', NULL, NULL, 6),
(15, '2023-10-18 10:47:35', '2023-10-18 10:47:35', 'test1', NULL, 47, 1),
(16, '2023-10-18 11:01:32', '2023-10-18 11:01:32', 'test1', NULL, 51, 1);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0',
  `image` varchar(255) DEFAULT '',
  `charge` float DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `title`, `status`, `image`, `charge`, `createdAt`, `updatedAt`) VALUES
(1, 'Document', 1, '', 21, '2023-09-22 10:27:30', '2023-10-30 09:24:21'),
(2, 'Grocery', 1, '', 20, '2023-10-16 13:00:10', '2023-10-30 09:22:45'),
(3, 'Test', 0, '', 20, '2023-10-17 10:51:29', '2023-10-17 10:51:35'),
(4, 'testing', 0, '', 111, '2023-10-19 06:33:47', '2023-10-19 06:33:51'),
(5, 'Medicine', 0, '', 32, '2023-10-27 07:57:35', '2023-10-30 05:19:59'),
(9, 'Test2', 0, '', 10, '2023-10-30 05:20:17', '2023-10-30 05:20:26'),
(12, 'Test4', 0, '', 10, '2023-10-30 05:21:48', '2023-10-30 05:33:12'),
(14, 'test111', 0, '', 111, '2023-10-30 09:25:21', '2023-10-30 09:25:25'),
(16, 'Other', 1, '', 32, '2023-10-30 12:01:42', '2023-10-30 12:02:33');

-- --------------------------------------------------------

--
-- Table structure for table `classifiedAs`
--

CREATE TABLE `classifiedAs` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `classifiedAs`
--

INSERT INTO `classifiedAs` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'Admin', '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(2, 'Employee', '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(3, 'Warehouse', '2022-07-04 17:21:11', '2022-07-04 17:21:11');

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(255) DEFAULT '',
  `value` float(8,2) DEFAULT '0.00',
  `from` datetime DEFAULT CURRENT_TIMESTAMP,
  `to` datetime DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(255) DEFAULT '',
  `condAmount` float(8,2) DEFAULT '0.00',
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `deliveryTypes`
--

CREATE TABLE `deliveryTypes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `description` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '1',
  `charge` float DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `deliveryTypes`
--

INSERT INTO `deliveryTypes` (`id`, `title`, `description`, `status`, `charge`, `createdAt`, `updatedAt`) VALUES
(1, 'Delivery', 'Get Deliver at home', 1, NULL, '2023-09-26 07:41:48', '2023-09-26 07:41:48'),
(2, 'Self PickUp', 'Self pick by the user from the delivery warehouse\r\n', 1, NULL, '2023-09-26 07:42:23', '2023-09-26 07:42:23');

-- --------------------------------------------------------

--
-- Table structure for table `deviceTokens`
--

CREATE TABLE `deviceTokens` (
  `id` int(11) NOT NULL,
  `tokenId` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `deviceTokens`
--

INSERT INTO `deviceTokens` (`id`, `tokenId`, `status`, `createdAt`, `updatedAt`, `userId`) VALUES
(5, 'hjkkh', 1, '2023-10-11 09:15:55', '2023-10-11 09:15:55', NULL),
(7, 'hjkkh', 1, '2023-10-12 06:58:28', '2023-10-12 06:58:28', NULL),
(8, 'hjkkh', 1, '2023-10-12 07:21:36', '2023-10-12 07:21:36', 12),
(9, 'hhsloorrue', 1, '2023-10-12 07:23:44', '2023-10-12 07:23:44', 12),
(10, 'hdhdjhehjhsjhuehejjh', 1, '2023-10-12 10:30:05', '2023-10-12 10:30:05', 12),
(11, 'hdhdjhehjhsjhuehejjh', 1, '2023-10-12 10:30:05', '2023-10-12 10:30:05', 31),
(14, 'fm6cLm9vTX61G3XITuvpMF:APA91bGLcjGOEFeMObrszksTG3q40xl3k2itjDFrSwvxQIH1qAdL0mPpYKZ0p-_QNCsxJjWlkJbxJLq2Fg8DVuSmY-plsUed6H4Hmvqfu72ANqoi7VbMldd4msIOmwlA4BPq3WRHE4c1', 1, '2023-10-17 06:24:47', '2023-10-17 06:24:47', 32),
(15, 'dpAWmM8WQ9a2HMenvHoNor:APA91bG77JQfuYwrLH3Rw2oF12FPcsdLB_rRmeuxqFFlsC67XZRLd_B-hJYQ6d_aoJ5G7eoS37863vxaxj1IwJhtGs5BiQSxBuARNMZ-2v16vr77WBJ3pttGnE7NlZKY1bYodFdtFdZq', 1, '2023-10-17 07:56:26', '2023-10-17 07:56:26', NULL),
(16, 'hhsloorrue', 1, '2023-10-17 09:30:12', '2023-10-17 09:30:12', NULL),
(17, 'fobOZiCkTxCvCYmj7eeUM8:APA91bFsCpW81Slvqc12pTjBbHbmHQa1YzSX_GxgkZe8LEaz7zyVPEOi6lTEgrHOb5iwQIVcNnjJpmqYnjw3dgB1UUSuaBO5mQnb4ElFp2QmVoS2IyJ1oTe0T44JQGjThJCpu_0JLzXo', 1, '2023-10-17 09:37:24', '2023-10-17 09:37:24', 44),
(19, 'c6R94iU-QBGnFuUzFyJg03:APA91bFJozu23SonfhrKGF86ggIwEMo9uqa_qo5UUteF8-XVjhYp13IPrNT8b18uiHTF7yhuFv5G7lHFiXbUKUlJk8txkm2D4Q08DHnWXwjzUhO9GXVgu8wLjrnFCBiduCHQcF0VrIlB', 1, '2023-10-17 10:29:41', '2023-10-17 10:29:41', 45),
(20, 'caiLb8tQTzGQEEpg4wPaj4:APA91bFdf4ffep0p0SCxrEANpq1sjL4RTmBBe8QDeJPEGbZDrxvR4_6qi4qvAeypV0AA7VbLKjO_UDzGtxZxbQoH-HD-Ow2VNgficBmqvNZWQl9ui8hkPl6wFD5FUsBu0frgAPXCykT8', 1, '2023-10-17 10:52:35', '2023-10-17 10:52:35', 45),
(22, 'fa6WSYMfReazSEGK3eLcBr:APA91bHBhkPVHp3izASVtULSYPlawmTX4ElJxoxIdv6Zb6h-R0HHxEN0oz-2-uWSLIJqgqDpWSlcxVpojC4HqTN96KDS2X2dEha6hk89MERYlCA8DNRE3R4eaccZCMfX1Eq7DkN8yhFF', 1, '2023-10-18 05:23:47', '2023-10-18 05:23:47', 32),
(23, 'dT5S8NPzR4-6Z9m6dGB2U_:APA91bF-qLJA1OWGancnOlnJjpGwcj-LXRGpqUAfT6bMCk6OqzV-GQ2JRXozT-jrTTQQdBvVjJ85butZtEah1j_-j9ypis989Zn7IOA8NoH6dqCtOq4aKkSBSPGJ1Wr0EcY-mc1wYTYM', 1, '2023-10-18 05:47:44', '2023-10-18 05:47:44', 32),
(24, 'dm35UHCITwG-1JH5lJrtFh:APA91bFPKXThy7quDDHwgbHfk9UNwnB3EVN1XPhKH7s-_WT7W_25VNO4VYA2navyTo7_YydPXf1AmwxTHQrv2CoN3o1URQiPCD0ewuXLGE6-kQxYQ4xGLFi8WERcxfq9Ay4U3n7KA-pN', 1, '2023-10-18 06:37:31', '2023-10-18 06:37:31', 47),
(25, 'dEyRmDe7SAWX3eEYf6TKPs:APA91bF16J_k-lB2Fgp5watLXsklM0mW_Ume2l8W5io-JuW75FqfvhpHATgmQ-WfSDF6lhU0n8VJsqQIf-Dcm9ek1a6c7dpyQN4_DU_GV-VCikrUnEObSZvp3Bvkg9qKc6p4vd0c9P7p', 1, '2023-10-18 09:17:41', '2023-10-18 09:17:41', 47),
(26, 'c7xzlDdCTFumVZ-t5AdxrT:APA91bEfGCBzJEOIVgJLtq3fofBzWucJ3vkzI0T5op8b6p_O2OGRXLiozrH7Gf7t3Yj5W4f-jq44n4PtgRxK6z1peEypYuUgqXhCAKHW-SlLRJ44GtvL_sa5edca_RbeQBcUYSpXHJDc', 1, '2023-10-18 10:40:12', '2023-10-18 10:40:12', 51),
(27, 'cGb2QUUcSw-TPJmfFkl8Xn:APA91bH_D9o3CjNrYNbfHPkvkqlE0v8FiWzPknqc7tJMGH2MMMdTVH8faysi1NfQqENhDoDMThoe1Abx8j_cewbgSaxUFbrgW1e4lbh94A9boN6HXmMqokHPHhDgCxyD1DnOlQXjvBE_', 1, '2023-10-18 11:32:08', '2023-10-18 11:32:08', 32),
(28, 'hdhdjhehjhsjhuehejjh', 1, '2023-10-18 11:56:21', '2023-10-18 11:56:21', 32),
(32, 'hhkhkhkkhkhkk', 1, '2023-10-19 09:40:20', '2023-10-19 09:40:20', NULL),
(33, 'dw0JEMR4TUaQ3F7hgEW2yP:APA91bGiiqfs1q7eP_l4gin8sRWvlHdVpBTJ8e4MeNFvaGJKZlE3cyWf2EZi6XO47P0wTLOEyISH7W-zts0skNYFEJEMdU0CTFTvVVcXZ7iIU0DlVDHa0PCNsYrHnfkfMmgsLfW9TuTB', 1, '2023-10-19 09:49:34', '2023-10-19 09:49:34', 45),
(34, 'hhkhkhkkhkhkk', 1, '2023-10-19 10:06:14', '2023-10-19 10:06:14', NULL),
(37, 'hhkhkhkkhkhkk', 1, '2023-10-19 10:53:08', '2023-10-19 10:53:08', 55),
(40, NULL, 1, '2023-10-19 12:51:45', '2023-10-19 12:51:45', 32),
(41, '', 1, '2023-10-19 12:52:15', '2023-10-19 12:52:15', 32),
(42, 'hjkkh', 1, '2023-10-19 13:04:54', '2023-10-19 13:04:54', NULL),
(43, NULL, 1, '2023-10-19 14:17:05', '2023-10-19 14:17:05', 32),
(44, NULL, 1, '2023-10-19 14:18:48', '2023-10-19 14:18:48', 32),
(45, NULL, 1, '2023-10-20 04:48:39', '2023-10-20 04:48:39', 32),
(46, NULL, 1, '2023-10-20 04:55:44', '2023-10-20 04:55:44', 32),
(48, 'fDieBN04T-aGVu61pKjo29:APA91bHujxjBr-dNeaRFLnjgAJJfRPHfHZaL2x4MoMafBsP5kn8MAV7wjFj4h0S2tZJJmAZX6zLTjHP4uMXFVG1uddSvHB9QLQfdkc6wXjhsX2RQyokQHPNtN02E49LaOAeLTKKSnGfI', 1, '2023-10-20 06:03:38', '2023-10-20 06:03:38', 47),
(49, 'fUXi4zh6SiGz_Vy7d54fcG:APA91bF-1NYxykLI6tN__j3mjBWH2YNN2JxztQWjYczMtqK87M6fbgUD47Pw9P8-pdJVJSGglLs142rQ4JuOehL0NGY_CZf8yosZ4_-3Dr-B439n63LptKoyg_RevKHX2-dtTx7m7PSI', 1, '2023-10-20 08:07:17', '2023-10-20 08:07:17', 32),
(50, 'hjkkh', 1, '2023-10-20 10:42:49', '2023-10-20 10:42:49', 58),
(51, 'hjkkh', 1, '2023-10-20 10:57:02', '2023-10-20 10:57:02', 47),
(52, 'eGbWMB4QQGK8X2fzhzk76f:APA91bFQ0rz-uJjK3UD3UFbhqAknCLmm42tHUXD_wZfI0a5UINBqUIEkviDIqEJ5oOwzJVdGmvD7fNwSC6WBi5PTyM_flirvHw1aOXWmufmO9AmDS9UcZvRUel0XM0N_kms180UxIvmj', 1, '2023-10-20 11:04:20', '2023-10-20 11:04:20', 32),
(53, 'cpZNrSriS2S3n6y9R_oLTi:APA91bE48wbAlQ9V-lJKrE9lvat0_S-PaPgNkS5fWvsncG3zQcVm_fzy8nLL0bAZUmDNamWr4Fnqgg1a4GkyGSFEIHNwFAzg5Octm7rzf3J12sR5Y6yPrN1_Q9Ro5viIyK6-_v8VRgAd', 1, '2023-10-20 11:44:02', '2023-10-20 11:44:02', 45),
(54, 'ephWuobySruMvZXiu_ZdKP:APA91bHB6yddycCGevWZuWFlrxkuMua-Jx8yrjdBzzs8srRMv0uFOc5_Y8NdJHMzs8ut01Qu_HFKMq7kASGk-vW97c2ubkMFIevWRFsI65yytkWEhNsYQ6lqtocDtOTlAZVa7npqvvcz', 1, '2023-10-20 13:10:03', '2023-10-20 13:10:03', 32),
(55, 'fk43aIEeSKekRjV2kW4Ncm:APA91bFgGYH9Vs69X0iugjJU3bZoJhD9GXTn52AeyqIiQ2T8KA_BIiGhkDIazc_nSWkXuGYHxwtIgW8OTu93PzlKM3yzPh-XwViPmnwG2gqLX2LzvQDs_1BPY3p3RCkDEpmZAOjeEkao', 1, '2023-10-20 13:51:43', '2023-10-20 13:51:43', 32),
(56, 'hhkhkhkkhkhkk', 1, '2023-10-23 05:49:57', '2023-10-23 05:49:57', 32),
(57, 'cFOahVKpRwuoQqee4IBzL0:APA91bHTste8gEiIEF8I4zz6OB1rxtjcZLOPkcahRzJ2BJq9BAUNGUmYny0cP_kjWvKR-0oIZ7lsCfRBg2gPMmEI3EVvX5kGGNSiVxy9agQFsQgKcCqtKZOCzwwlAKScrs7xTjI1_oN4', 1, '2023-10-23 05:52:06', '2023-10-23 05:52:06', 45),
(58, 'sf', 1, '2023-10-23 05:54:21', '2023-10-23 05:54:21', 32),
(60, 'foCBGs2eTz6OQnZJ2Hta5_:APA91bH6Z40rG4v-KBYInYY8cRexShGMQWyh0W-pMK4FgSdq3oqIeTvCQFQsvnAZBeCBY-FKjs7saGZiuW-E8WgdTW1IW3eq-LHT0pZDSNzDvDiXPEctTn2W4ytX5Qshq5IseRrg7m2Y', 1, '2023-10-23 09:29:16', '2023-10-23 09:29:16', 55),
(62, 'fHQ01-GsQfez38Me5SuKIM:APA91bHwlmiEE3kwQx90GW1-ZVQSZePZ9guRSkI30i21gCfZ9mvuBj19a8mhoQ7FgBjXY6qJFBGu_hn-VqGIEXGsp35q6zZ3HGVMGag7Qt3IQszXzKGZCDsqe-0YBxR-tZIpGEcDXqOB', 1, '2023-10-23 09:46:07', '2023-10-23 09:46:07', 32),
(63, 'c6SLOMyj_k0Worl1tebz8l:APA91bE7zCgEHA7mfbZLHY1VshwDwS7mLMuNad-XOhwWNZFSWo2w9KqRJfQp7AQHYSPvYaoI3V-JhSY0NcnvEtIfp7707yCAaT8y0jkys98KLz7oNVMXuuAAB3QfkqiJHfQtiPud5SXA', 1, '2023-10-23 10:03:47', '2023-10-23 10:03:47', 32),
(64, 'hjkkh', 1, '2023-10-24 05:29:31', '2023-10-24 05:29:31', 32),
(65, 'dtxmXVexNUdSgGJN_txX-M:APA91bHnXt5_TBQUhiZ6wZSRwLWGYnayYaU_gSBcf4ExQpYy79hLmxkc8wm9TFj58rxDFCUPjODjc3oHSmGhPPbmf-4ouRJ9x_f18CVyns8c098xW2T_HUEFjdA604ZCGgz0o1TcNUO7', 1, '2023-10-24 05:42:37', '2023-10-24 05:42:37', 32),
(66, 'd8WQxH8Iw0VzlLo41htB3k:APA91bF3OBmTVaNPQI_GQI1w-bRokGnhrsKtXsbZ0sEtq-I4l4kSUkglKSkWP2JJtNiWD64ESbU61kNqVk-SXXCSR3Kgh1PDk8hr1MsKHahUqqc8UnIECiCvwMvscCT2-DOcbAUZaKAj', 1, '2023-10-24 05:58:16', '2023-10-24 05:58:16', 32),
(67, 'hjkkh', 1, '2023-10-24 09:20:40', '2023-10-24 09:20:40', 60),
(68, 'hhkhkhkkhkhkk', 1, '2023-10-24 09:32:53', '2023-10-24 09:32:53', 60),
(69, 'cExMTGh1Rt29tJZAn2UP_4:APA91bEu67VV5RYXd2AUSpvT3Lp7e1S9kNf3-_zBjn5fIOvzM74Y9kfwiGhu4pDtz-xOKQmxgdof5xEckNxgz8j8TFMC4db09_-l978oC25MiEqwc3ZLFMm-ZuCgZonCFCkTE7LVNWVo', 1, '2023-10-24 09:52:25', '2023-10-24 09:52:25', 59),
(76, 'cLfGbKjFQpC6GTarT8OQ12:APA91bGfhWNQQNHH-SaDIQjaR1oz9ntKmny4QUWGN8zkdy9b70yWmwYbQKfPDbw3bMtCgX9ip20IHTPQl47bxzHjHVGsOU1EENHfeeCQb2ASH_65Kao-RI3Nfp0RWMkZJWkJsAlx-jle', 1, '2023-10-25 09:16:00', '2023-10-25 09:16:00', 32),
(81, 'd3w0kSp3Q26-ys__mesfVw:APA91bGxJanBqhYVnRSGSwEdTMZKBpq50EA118avACQBkpWm7JqWMUAyeKqGqErjKvhhTfhHl5eKUxfjNTwIg5odXlgN9Paqpc1wZ6HRmplGRy6_xo3kvDGN6kA_MGaQQX_YzNizlJmP', 1, '2023-10-25 11:13:43', '2023-10-25 11:13:43', 32),
(82, 'cKAZgCB4S92h1Bk4DmvKL9:APA91bHbZYdiP6XkDLY52ai5zmCFU8NpHCXJRGb2iw04cTB_R8HVgxUbrjufdsLx0ECRXymSiNanV_dev9QYUxTO0R7VVnpNp7e3zguCccEnK9bQKLtCpJcLurVJF1hJ0VhYqKZTgXc2', 1, '2023-10-26 05:33:37', '2023-10-26 05:33:37', 45),
(83, 'dScNG_9zT2izX2U1jW4jcQ:APA91bEvWaDKmbAoU1Ew30jQ0j2T-SpDR44mJQET-ZfejFhl_peIjYPO6AIQ6U8bWcMDWq8ufXNQLQiqJAwL4uPJt-6edYSW-DNGpe9aNvrOrFhYGf7ycxoQnkkliQxRs2DlQmUiKIhu', 1, '2023-10-26 06:10:45', '2023-10-26 06:10:45', 32),
(84, 'cTWqjCcUSn2KfzmjHEXh8w:APA91bHSIJCGUWlEZ1LLVF7CJPwm-gmXtArn18VmA_2dgmtNgtR6Bvac54MPPDdsXmeKnTtYFs7SyWba7jyKV9UGAD99fEDskwx6oRQ4mDEk7nNNUvPDDnxM27QLV6w0Pz0tOYojOpNP', 1, '2023-10-26 06:13:53', '2023-10-26 06:13:53', 32),
(86, 'ePU_JYM1SGaVKecaffcKhi:APA91bFW7jXD2ru1GXI2IgKJNeiWhoC8ChT0RsJmBNre93UgHciX_HtuOxxQ7GgUNf1n7VZDPV8DWX32CEVc7M1z5-F7rdQV-siF5iAgiEKP1kNU4RK93l0TgcMRRRRZkfYmvdsZFzYv', 1, '2023-10-26 06:18:22', '2023-10-26 06:18:22', 45),
(89, 'cjTSmCfMTheA2k5lfHszYx:APA91bG7ZBeECI43humi385unLVwguD4fbHfBPcuw_9tM4dW__EUFwboy_aMZVH2UqwyoovJKfND1-bABnAX7AitPsEH01QRoJZxgBmoHpLC95cjJoFKhNZqTybLgGmBg-HS7GeOq4ew', 1, '2023-10-26 10:01:06', '2023-10-26 10:01:06', 63),
(91, 'cR7bXDJaTG2kdagTGoMwey:APA91bEK1FtL4MdWqrp1irxaugxsH9TWJiZBIzyPaayNbmaDLqFSm4xC4Oput4VUr7-u22pNztmR44euUdXwNqeCfEz9xDZXH-mYSye0FXliTtP5G5rKZSCoOmmS5Ldy5RVPERB0K1aS', 1, '2023-10-26 11:52:09', '2023-10-26 11:52:09', 66),
(99, 'd3EcoqITRBeZ7FebfP963N:APA91bGKB-xWNiUTHeDpjY2fAgOOVRKdTL0X6CW8YAhY7p-8Dcsw2kBeaLwGjy1L8zB3wsbl8sB1LFXJIytglUL1eZiFwvWPadiSfDPqC1xgsnyacrHW00Ej1zrDS0TQfJ6MYAXKegiI', 1, '2023-10-26 12:32:52', '2023-10-26 12:32:52', 45),
(103, 'hjkkh', 1, '2023-10-26 13:24:44', '2023-10-26 13:24:44', 68),
(105, 'cH1g6qorRL6aNLYUmH-TWB:APA91bF2anA80Z8sP4beyYs4s2aZohdOUEbvZep03XLGOAluJGcD_Z6lN3j9eSp9z8Fsrzn7t_sc1zrYSzmaJWmIykMlXAbjgiQXzcVrP7KcW9z9XuYCStxjQxfbAOVPI7rQvQAy5fBQ', 1, '2023-10-26 13:33:15', '2023-10-26 13:33:15', 70),
(107, 'fQ0AFRqoTWCfMhNeQVPqmu:APA91bH5QLk5zPHoQs31lSckHCa53voVf3rOKz28EsjvNQWy8n6BUC9fPbE_bhhhu2PbuYJwcNMII1xnjG2neWoTzuPpTrgnigJkskNfxqEAxtxWYuwF5LjDCslcNYlnFJLT9rHFbBa-', 1, '2023-10-27 04:26:18', '2023-10-27 04:26:18', 45),
(110, 'emT9VrhURZ2mCsthaZaaKI:APA91bFE8NBLxyoQdyTfaxnwVDlBdyUrHbqcxM7PkDyqKrEIpQVJE-a_bJGYw1WTHxisjNzP4etAjd-9FG__C6ZAxFx82DnBaLKXOgFQrPU2c52EIM4SfaFeuwMFoqBmzMMrcvqeliNS', 1, '2023-10-27 05:43:45', '2023-10-27 05:43:45', 62),
(115, 'fakqziSWCEJij9A8YZf6OI:APA91bFuW6FRk7cqC1RAzuMJ0Y398iW1w2KVPcj8ui-ff4X5zrWhlkyzk61JI5NgJs5SYk-7xnX1_yZKay6Zxsugp3vEZqfVQ2czNfh8VFTVC_70ENM7JUHhSGr27A-DeKoy3RQH5ZCY', 1, '2023-10-27 06:47:05', '2023-10-27 06:47:05', 32),
(117, '2179be7w9sk19', 1, '2023-10-27 06:57:03', '2023-10-27 06:57:03', 7),
(119, 'dFNF9erYTcaOxHx0n2DB-u:APA91bGH-D72X3p_FEjo9zrAT-SpRKqNoa8qHcNEhQLNRw2YOMgCoqyfQaoCJWX2q2Qzsb6IWsXOPY1B7cpeXv-IxQIQQHfJhunGOFDyU0wUm11QGOuj6x_nNa4BoSLezQn7IMywqFs7', 1, '2023-10-27 07:07:34', '2023-10-27 07:07:34', 7),
(122, 'fnJEMEtSSzyOYGomVZrX4s:APA91bEwFi2MgAZN8dn6-5qmkS3JEE16r25zPaH0koDsER1UNDWmo2H9ouaWiXChg3tum6DpK1gnHkL7TxMx3EKLKOus8DNYNNgrDf8b9VZooQGGDzYQGh6e_9cE_Sqrne7uVzzqoK8T', 1, '2023-10-27 08:07:03', '2023-10-27 08:07:03', 32),
(126, 'cY5V-vXQTSWbebq9ttHDXt:APA91bFkXdD29wvk2svx-5HC-aLaGcNQPYj9LSPdNm0dNRNMyg-8Dhn95X350rHvDqkT1HqE2VqbejpHby18jpcd7-D4XO82v5rI8N3FwNa21ms80hYM0wp9eDNTmkBDhXgSpoIjgHtH', 1, '2023-10-27 10:17:06', '2023-10-27 10:17:06', 7),
(128, 'cZPvih6fRN-f6rgOaCzGaK:APA91bFfeV08Ts3jZjsdeYZkQxPBL2P_2D8_u3rfXVfpFbbM6mQ60tGQ6A1np42CZmwFWtr-wudRd7BxtgFMuT-YeS3_xpXjEY_2Y5hkUOPy2mKqcP3x9mmT6hwiAqUzEanLsbvdN9Zb', 1, '2023-10-27 10:33:34', '2023-10-27 10:33:34', 7),
(130, 'cZPvih6fRN-f6rgOaCzGaK:APA91bFfeV08Ts3jZjsdeYZkQxPBL2P_2D8_u3rfXVfpFbbM6mQ60tGQ6A1np42CZmwFWtr-wudRd7BxtgFMuT-YeS3_xpXjEY_2Y5hkUOPy2mKqcP3x9mmT6hwiAqUzEanLsbvdN9Zb', 1, '2023-10-27 10:51:17', '2023-10-27 10:51:17', 73),
(132, 'hhsloorrue', 1, '2023-10-27 11:21:58', '2023-10-27 11:21:58', 75),
(133, '2179be7w9sk19', 1, '2023-10-27 11:23:25', '2023-10-27 11:23:25', 4),
(134, '2179be7w9sk19', 1, '2023-10-27 11:23:44', '2023-10-27 11:23:44', 71),
(135, 'eWKoIeqlTjGEvORZWSX6-P:APA91bE-nK-dW70vYu7sp2wNWAMpCdkkV9EccAnTVkK4tHculBtcUmi55xy1gZNADRX674OMPZWWadVItgCEBz43fw544lQrge0ZnzQNBlrKZG0DsV_IjsOeI5Wydiid2rcCuaVhlsmn', 1, '2023-10-27 11:28:53', '2023-10-27 11:28:53', 71),
(138, 'cAWy2vi9T2SuYUUhsuAWUM:APA91bE9xD0BgPL06WLSWAIQQPwby9KvW-x_aQEUScFeFYYEWuMkps5MSOl1sUDoEuzbye8IthNRFCatHKlZTyJ_tQnLDjDw17anuV6oHlr5UR7ootS-MJ1-MsLtt_-v_Cq7N-Nys8L4', 1, '2023-10-27 11:58:41', '2023-10-27 11:58:41', 7),
(139, 'euxwRPsEQTibejzSJIIPAb:APA91bFofh8kzqhMZHtO8TMBFdaBvqdoA6AMfpyruQb4u9Gsd-Xxdsy2n_TB1hhocibPjML-DEWJJLlB-awJZi9vGdhYVvaoKFJ5HU1v1V5kd-BX62gwsTpHxM0Q9pNcFPqTAuMpmkOq', 1, '2023-10-27 12:34:24', '2023-10-27 12:34:24', 45),
(140, 'ctbIZupkSza4D5JjpPW1BS:APA91bEweG6bx03gOPm0Op_2D4f3TtDwSdSekdcnZ3vpNE12PsHk2Bu2FuV2yOiX_HV_Hl3nl8GFpWk2q-_pCC9__rUnG9SRKUNN6a8gEn38bd5ySOru8fyXcltxxxKEIPWXardDpvrp', 1, '2023-10-27 12:49:43', '2023-10-27 12:49:43', 73),
(141, 'ed3JcCE-QX2fNeGrP6dcnT:APA91bHt1IIl9LBIta08Y6geMy8QHxjgbeuKTEDTdtfFvS5EMndHGZ8qo8ChkKo532_c2WmU-RwnAFGXAyFdeDRQfM5TosUpulYQ8WIMvmaNT7xp8wlQo6Du4ELYUz4BMoJTrANuQbiq', 1, '2023-10-27 13:01:51', '2023-10-27 13:01:51', 32),
(146, 'eI3adPXoRU6YQMiPHXF3QY:APA91bHGyghPjQFz2URzL5XWt_4SeDkjripzangcMxDnnNknBqdIXKIzDOjvPoE_iiXaYeO9X3IeA0d4LCzG9lXrTYHAVPP9UYkCNuyDFzZDlgVr2zQU8DgGyZfp2vFKBM3PbLV4sMF0', 1, '2023-10-27 13:19:57', '2023-10-27 13:19:57', 32),
(150, 'cjEId2idTfaHCpK1BKyQfV:APA91bG11F2D9tl-JMZ86TlPpJg94HZeFYdjCgKKecJgFkKqzm-yxYNf7GqxZ41kjQlN4PSb-v9qYbFzGkhhR1OPIAABxf5JYB8xMl0JYfYMCX96WgMDX5lI_ONKA_KDCOBzBnWdUMmr', 1, '2023-10-27 13:42:53', '2023-10-27 13:42:53', 4),
(154, 'cRJzlHovQ0K1H_uNAtlnrD:APA91bGSg0DuLzjDx7OrggSlQUK4LnI4ysJAyEtIKVQ2H0ifRovKQF2SaKsaywKtmlYPl0oqtOTwHdcFD7EoXk1tFf5gYHSCTXrC_o-C52C66zMl8CaM8yAX6Hz61M8CyB0R1EIb14xH', 1, '2023-10-27 14:19:23', '2023-10-27 14:19:23', 32),
(155, 'dn_q3sQJTwq4k7oAKwUufl:APA91bHeV3tZzEjvqILu0IlSdMgHZn0Zby6LQV8UiO1torj1r0ZjoR2sozgxGBfBoWlf4gAIjNyZLrD9BZkR-67qZxc9GfLfNAQ_dz8cfWdhYm_rGsbTbpX0A61Kq6q4iGCM4sc961j4', 1, '2023-10-27 15:04:29', '2023-10-27 15:04:29', 32),
(157, 'eOize_VLTIWreH6yNYbdRG:APA91bHOoZAobDQ66So0jvDFbSE-WO7vu5SW2f0I61B6UyaHYjCC2QQXuEyvukFP3hbbAUIjtgpckFHuMJyX3zK2JMpxf1hz857YLcxW5GaqN0SURyjU1ItQEaXR_IoVI7LEdRYDknpc', 1, '2023-10-27 15:38:08', '2023-10-27 15:38:08', 32),
(158, 'dsYDVgWJTlCdu9i3abfvo-:APA91bHkXRVqLT-Papr7Xx1C_zOjyEvepz1HUMISWlDG1g8tKniRitCUy0SmwtY7RE_py6b4FRYW9mWxcJktjW5qZ63ww1m64jIgcc0EfkNX510LC6LJ_cXUpYHYqmfcEuANAycLWVLp', 1, '2023-10-27 16:03:04', '2023-10-27 16:03:04', 62),
(159, 'eFx4vI-wSe2ZS4Vd8jlhos:APA91bEkbYcf1wXWjmWZfw-ZIhHt3W0Z3KxafdW5UuDBKW2lvakvnhg69qxxkZ-DrPaRb8wqwxawyCgWY5hXz9w3gvPl9h1_f2NN1FI6fYSITkpq95y6cZTdQP_0oRA509I40n6VG4SR', 1, '2023-10-27 16:24:43', '2023-10-27 16:24:43', 62),
(161, 'fBnFg2rtQdWc-a0w8ZfKVV:APA91bGfEul5hi69TeAyBYuWvBQIyXhLLfZXxbKA13xNI94FqFCHjZgyCpzPjxli75d_SRwekUUKqx9OKO4LFNLOAzOtB1-Ug2kaajKZxSmn6QbKuwTAnT2Nx6VV_qHG4LYqIZ1NxWNO', 1, '2023-10-30 05:30:01', '2023-10-30 05:30:01', 32),
(162, 'cTOOsv9QRESTYIU2WEYd_o:APA91bHo8RN_m3vxRxoFZe2UTlelKTXvuznfLeAPhSdxYpwqflUOlpeAB1w4lnDyXA1idkV2lYMTswzArjtSRF1wQf7KR8utIx9o6Ae54L6pdigCtaSAeoXySq5JtBeLD9T27pNx-L5N', 1, '2023-10-30 05:39:12', '2023-10-30 05:39:12', 32),
(164, 'c1UzoQD6RVSV8yRyMm_PTh:APA91bH9jJ2hVdSdE-tyROiuSH-KUCzcnobHP1aonHPFGLAbEfyLyB1gk-w1Y3Bad7BQctCm74u90WIhxiCMEaPWM4DyiLynlJRf9_g5umRHHknTi3G8vROmx6-DYYtSq6OxnW9lx3Sf', 1, '2023-10-30 05:42:11', '2023-10-30 05:42:11', 32),
(166, 'ejevfhQqSv2l14Q1XNbYkW:APA91bGGLexnrfV-gYW5-zKhDTttrhUjKMIU_vxZ98EHAp8Rj0WIPqw52CaL_YEC0wvqT2D5MqhzDNhe_wSnmSzVzVDTwpQMJXoDo4j33Blg9cX6wBJDY_72NUsc4MmZtLbchCyptxfL', 1, '2023-10-30 05:54:20', '2023-10-30 05:54:20', 71),
(167, 'eUxHAb5rQfG10cnR2WueoM:APA91bEcS-mK-XPaE2H32cIXUF4BdMtlpGU5QpJ_S_fhUXtbrol8zW6EdXgMykHEqX72Hj7YDDBqJ0RmBqO9hHIoom_N4Xc_qsEX9xeIgBvkEw_16ni6gUEda4AqMehTTysF6F4VWcM8', 1, '2023-10-30 06:03:46', '2023-10-30 06:03:46', 32),
(168, 'd-cHBtxXSXqJifXPCiir5X:APA91bFOqy-2bskMLkUnihQ-5ZGT_0MGtjXnClzQL0t1DNhuAgOvxDoW_aM7ZfIvBJ4rhYZtKi3jn0BOvdzkCti43XdDWvoD5uwd1w16D-DUsZA0Yu5MZotheofEwkm3B9tTFszlFW87', 1, '2023-10-30 09:17:39', '2023-10-30 09:17:39', 47),
(169, 'eVm16S6CFkPdrHjtoeUwDL:APA91bFd1NH7BSBR4E36C-PxLqyWw7RQBMezFlbd_6dw2E2aBTYeNtksAAYSkAeAWYPANPVVuNZFN2fgnpcQ388MFoeFhfB-gI-UxLH3GUhE4kKLysJx2fQpU5FtLqVLZ0ESi_8mC1sr', 1, '2023-10-30 09:19:58', '2023-10-30 09:19:58', 32),
(170, 'edPi_DqLrkccsyglrU4VEV:APA91bF5Vj43ovXV9A9I8uh41R4L7NNILCtbGlxUmgI_SvFVzyFrwbyX6EFr7kaHSPmRsZXItBP2oAEl27U16QyourA0xnRKi0mO4GaeIe7SVbaIC7P7Bfevyq0j98qccBv-4KoLZKoq', 1, '2023-10-30 10:16:40', '2023-10-30 10:16:40', 32),
(172, 'cGEkQl_1TUOFVgaqdfZlu3:APA91bFlvi50cunJDxA67nSziIkUZIEut4U4hlkQSx-jCBlWP45pW-CNATG6-2L4Yz_F8UyaUnFvxPaIZxp_FcjE2o8Fu0MKqaMb0bnVL4Ppce0CWTwGVL09Je3w3Fi6igQOvllaI_2m', 1, '2023-10-30 10:47:20', '2023-10-30 10:47:20', 71),
(174, 'cqb5iOFBNU1Yi23mEPJiQu:APA91bFvfmlGLbuEKZeY9flh8Om_-kdnTfSPy-mEc8lIC2aealwanuwhT8W4b5v7gil_aUZqaQcdJeU5J8GCh_nEltkDemVk0pRUh6oG5GAojwYNw9er4WUtaS2_16i8hr-UyVc4et0q', 1, '2023-10-30 10:53:34', '2023-10-30 10:53:34', 32),
(178, 'eZRPEkWxPU8HuOdmT1D0TO:APA91bEMDCoezDbgBiXAqcMlsc03C_-oK99tSoVrIk-f66OVbERPbYwmNcSn7-VxbLlyHjjKVzDGKvXoh-NBPMpsM_bJfjgPkX-Hd2myMKV7LF7ZjKCMpv-4bi8kz_Kjwl64QyTrMg6l', 1, '2023-10-30 12:03:10', '2023-10-30 12:03:10', 32),
(179, 'dVXEw3qpT6yreFBJzK7JIb:APA91bFsxUM0xMPp5IO6F4M1pp2r6VUTFl6UW7TjmlLJHBooKXtWs4sg2vL_z19ZgObJ0mSIkapHjqN9yeR4e9oEOdNh25-84o64f79tJ5nKGq1y-r8KBBUvex6FBZ59j6m1ZWTfvsHo', 1, '2023-10-30 12:25:53', '2023-10-30 12:25:53', 32),
(180, 'fV8yf0_RThuNZjhmIHRDDu:APA91bF6qmZY2Bws5jzWtUujEfGbG01yOzKGbyn9KITr-Jbz-GHBllYscsGuNFIYZN9V-sviQeAuVwl83F_O2mOX5s-PqNhvUImT77PvFhUyl0s7cu7chlOhvNBINJE1apmLr-G63sp1', 1, '2023-10-30 12:27:32', '2023-10-30 12:27:32', 47),
(183, 'fYWqPj5DQ5CUgBxmX_664-:APA91bHPs-6JffpcqHdkCgvSXNEN9vXUcVt4M2UlU6Y88caKS82-F8h7UIHRWo0eO0rsjheI770Fhvz28DA1Gu83DyzISGvU0KyuHxx3J4oSmuBK0Y2Cn5DfB0cs42pWIIy6pOCHDl6f', 1, '2023-10-31 04:21:11', '2023-10-31 04:21:11', 32),
(184, 'cJSGrix5SfOYG5XnoZxStW:APA91bG4TzXV0ChhXYu6H9jIFmn9a7YRs4PKKvTj4pJPLJQc5mgJPnWsl6keSzPTkChoZxl2WhrgMadD25RIVJH135PSuA8o3zaHxZHTLT2QlA2tLd1Bq2DPeIpdZ7ScMs_qwNWOe9KU', 1, '2023-10-31 05:16:31', '2023-10-31 05:16:31', 71),
(187, 'f588QzY4QT-jYCIzUFJ0qc:APA91bHL2xUDka4XoQ2SRoJ4LCwDq1Qmh1GU22gml8BS8zhf22N8nZV_gmf_R6EdiibXgh6LcBzB_BCQFJKM5wWdHZ1-K7Zsxs6JuRFYHryVe04dKYRLxv1_dNPYFuVdEgfmSMjBEXhh', 1, '2023-10-31 06:50:17', '2023-10-31 06:50:17', 71),
(188, 'hhkhkhkkhkhkk', 1, '2023-10-31 07:39:14', '2023-10-31 07:39:14', 56),
(189, 'eK_m5c80QYCWl9otQp6Dzw:APA91bFbh9IQj6gdwMovHQ5m6mjTODd5RPWFo9jB9AAVNSKM4dEUEevNqJHeMxDlsUrUKofTPN7lhP89FmmC402iTUFrp4uwGmWqKJcpj8s1HZGP9PDGV6hQwJH5nxE3HepHHWbYzAqb', 1, '2023-10-31 09:14:45', '2023-10-31 09:14:45', 47),
(190, 'eA3SPvK1R8S9nbIRE36nNv:APA91bFIFHrMLdcujPt5C8Z4VKeSBQhajDCMEcIphU8eas0yRAKhQA1sfpEwC_NCwnpueXvbP_SirLefepDg9_c90jMHq-XsB9Ost5qGCd8IxLzjS7lBoJa1YlJCNZxcj5NoD7FlSx6r', 1, '2023-10-31 10:20:29', '2023-10-31 10:20:29', 47),
(192, 'cHv_mHuxSU6ciGAsEBjo5i:APA91bH5C_QNT8lJbiql3KlvJXdOM8ROBdc1_HCB7GngNF6dK7_kGBmk1BHwWPm5kKjzd_ilRbiU1H7SicOJohL4NK9L-2LPU1AkUxFKatu5w1A9SbVy-AjhW3VSNSxDc_8yYj3hgxPt', 1, '2023-10-31 13:06:54', '2023-10-31 13:06:54', 32),
(194, 'dDnkl8pER2uw64TontlrjF:APA91bE6UDnWiY6kdybceqTIIKBL0xSG5ThV7OY_XgNgpYCJ5Y1Z7LcG561yEb9U0dwyq_wDxmFXU1XKXshY5o2BYlEPXMODdgpWu7qGFj8eOCm6ZzRACOPirldpKwcWNHVqrb14ounQ', 1, '2023-11-01 02:59:06', '2023-11-01 02:59:06', 81);

-- --------------------------------------------------------

--
-- Table structure for table `distanceCharges`
--

CREATE TABLE `distanceCharges` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `startValue` float DEFAULT NULL,
  `endValue` float DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `distanceCharges`
--

INSERT INTO `distanceCharges` (`id`, `title`, `startValue`, `endValue`, `price`, `unit`, `createdAt`, `updatedAt`) VALUES
(1, 'Z1', 0, 50, 1.30, 'miles', '2023-01-03 14:49:45', '2023-10-16 08:59:38'),
(3, 'Z2', 1, 11, 1.00, NULL, '2023-10-16 08:58:50', '2023-10-24 06:23:51');

-- --------------------------------------------------------

--
-- Table structure for table `driverDetails`
--

CREATE TABLE `driverDetails` (
  `id` int(11) NOT NULL,
  `approvedByAdmin` tinyint(1) DEFAULT '0',
  `licIssueDate` date DEFAULT NULL,
  `licExpiryDate` date DEFAULT NULL,
  `licFrontImage` varchar(255) DEFAULT '',
  `licBackImage` varchar(255) DEFAULT '',
  `vehicleMake` varchar(255) DEFAULT '',
  `vehicleModel` varchar(255) DEFAULT '',
  `vehicleYear` varchar(255) DEFAULT '',
  `vehicleColor` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `driverTypeId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `vehicleTypeId` int(11) DEFAULT NULL,
  `warehouseId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `driverDetails`
--

INSERT INTO `driverDetails` (`id`, `approvedByAdmin`, `licIssueDate`, `licExpiryDate`, `licFrontImage`, `licBackImage`, `vehicleMake`, `vehicleModel`, `vehicleYear`, `vehicleColor`, `createdAt`, `updatedAt`, `driverTypeId`, `userId`, `vehicleTypeId`, `warehouseId`) VALUES
(1, 1, '2023-06-06', '2024-02-21', 'Public/Images/LicenseImages/LicImg-undefined-1696574895990.jpg', 'Public/Images/LicenseImages/LicImg-undefined-1696574897389.jpg', 'Dodge', '2023', '2023', 'white', '2023-10-02 07:17:22', '2023-10-31 10:35:14', 2, 2, 1, 2),
(2, 1, '2023-10-01', '2026-10-20', 'Public/Images/LicenseImages/LicImg-undefined-1696574924591.jpg', 'Public/Images/LicenseImages/LicImg-undefined-1696574926077.jpg', 'Honda', 'civic', '2019', 'black', '2023-10-03 12:56:07', '2023-10-06 06:48:46', 2, 5, 1, 4),
(3, 1, '2023-09-11', '2023-11-17', 'Public/Images/LicenseImages/LicImg-undefined-1696572487773.jpg', 'Public/Images/LicenseImages/LicImg-undefined-1696572491047.jpg', 'Honda', 'HR-V', '2023', 'Black', '2023-10-06 06:06:54', '2023-10-06 06:08:14', 2, 7, 2, 3),
(4, 1, '2023-08-23', '2024-01-18', 'Public/Images/LicenseImages/LicImg-undefined-1697539255009.jpg', 'Public/Images/LicenseImages/LicImg-undefined-1697539256548.jpg', 'xxxxxxxxxxxx', 'www', '12323', 'white', '2023-10-12 10:19:24', '2023-10-17 10:40:56', 2, 19, 2, 3),
(5, 1, '2023-01-01', '2035-02-01', 'Public/Images/LicenseImages/LicImg-undefined-1697177303886.png', 'Public/Images/LicenseImages/LicImg-undefined-1697177304186.PNG', '2', '2005', '2015', 'black', '2023-10-12 13:05:47', '2023-10-13 06:08:24', 2, 23, 1, 2),
(6, 0, NULL, NULL, '', '', 'xxxxxxxxxxxx', 'www', '2023', 'white', '2023-10-13 05:30:12', '2023-10-13 05:30:12', 2, NULL, 2, NULL),
(7, 0, NULL, NULL, '', '', 'asdasdasdasd', 'wwwww', '2022', 'white', '2023-10-13 05:46:24', '2023-10-13 05:46:24', 2, NULL, 2, NULL),
(8, 1, '2023-10-13', '2023-10-13', 'Public/Images/LicenseImages/LicImg-undefined-1697178211298.jpg', 'Public/Images/LicenseImages/LicImg-undefined-1697178223352.jpg', 'xxxxxxxxxxxx', 'www', '2020', 'sssss', '2023-10-13 06:02:35', '2023-10-13 06:23:56', 2, 27, 2, 2),
(9, 1, '2023-10-01', '2023-10-13', 'Public/Images/LicenseImages/LicImg-undefined-1697198077997.png', 'Public/Images/LicenseImages/LicImg-undefined-1697198078578.png', 'a', 'a', '1', 'a', '2023-10-13 11:53:31', '2023-10-13 11:54:38', 2, 28, 2, 3),
(10, 1, '2022-01-01', '2024-01-01', 'Public/LicenseImages/LicImg-31-1697447297644.png', 'Public/LicenseImages/LicImg-31-1697447297644.png', '1', '1', '1999', 'black', '2023-10-16 09:04:21', '2023-10-24 09:48:38', 1, 31, 1, NULL),
(11, 1, '2023-10-01', '2023-10-31', 'Public/Images/LicenseImages/LicImg-undefined-1697522087382.png', 'Public/Images/LicenseImages/LicImg-undefined-1697522088249.png', 'a', 'a', '1', 'a', '2023-10-17 05:54:09', '2023-10-17 05:54:52', 2, 1, 1, 2),
(12, 1, '2022-10-17', '2025-10-17', 'Public/LicenseImages/LicImg-45-1697538554266.jpg', 'Public/LicenseImages/LicImg-45-1697538552533.jpg', '5728', '135', '58', 'sfg', '2023-10-17 10:28:44', '2023-10-17 10:48:08', 1, 45, 1, NULL),
(13, 1, '2023-10-24', '2025-10-22', 'Public/LicenseImages/LicImg-59-1698141143725.jpg', 'Public/LicenseImages/LicImg-59-1698141142432.jpg', '2021', 'susuki', '6666', 'black', '2023-10-24 09:35:41', '2023-10-24 09:52:25', 1, 59, 2, NULL),
(14, 1, '2023-08-30', '2024-01-12', 'Public/Images/LicenseImages/LicImg-undefined-1698403279735.jpg', 'Public/Images/LicenseImages/LicImg-undefined-1698403281045.jpg', 'Honda', 'HR-V', '2023', 'Black', '2023-10-27 10:40:40', '2023-10-27 10:41:21', 2, 71, 2, 3),
(15, 1, '2022-10-20', '2026-10-17', 'Public/LicenseImages/LicImg-73-1698403872487.jpg', 'Public/LicenseImages/LicImg-73-1698403867094.jpg', 'gjs', '2022', '0998', 'cvj', '2023-10-27 10:50:31', '2023-10-27 10:51:58', 1, 73, 1, NULL),
(16, 1, '2023-09-21', '2023-12-14', 'Public/Images/LicenseImages/LicImg-undefined-1698405725082.jpg', 'Public/Images/LicenseImages/LicImg-undefined-1698405725983.jpg', 'Toyota', 'Grande X', '2023', 'Black', '2023-10-27 11:21:41', '2023-10-31 10:43:42', 2, 4, 2, 2),
(17, 1, '2023-10-27', '2023-10-31', 'Public/LicenseImages/LicImg-77-1698411978818.jpg', 'Public/LicenseImages/LicImg-77-1698411977771.jpg', 'fggg', 'hhjjj', '888', 'white', '2023-10-27 13:05:57', '2023-10-27 13:07:11', 1, 77, 1, NULL),
(18, 1, '2023-10-31', '2024-01-31', 'Public/Images/LicenseImages/LicImg-undefined-1698730679719.webp', 'Public/Images/LicenseImages/LicImg-undefined-1698730679719.webp', 'Toyotata', '2000', '2017', 'white', '2023-10-31 05:37:14', '2023-10-31 05:38:00', 2, 82, 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `driverPaymentSystems`
--

CREATE TABLE `driverPaymentSystems` (
  `id` int(11) NOT NULL,
  `systemType` varchar(255) DEFAULT NULL,
  `key` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `driverPaymentSystems`
--

INSERT INTO `driverPaymentSystems` (`id`, `systemType`, `key`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Distance Based', 'distance_based', 1, '2023-02-08 11:49:33', '2023-04-04 10:13:22'),
(2, 'Ride Based', 'ride_based', 0, '2023-02-08 11:49:33', '2023-04-04 10:13:22');

-- --------------------------------------------------------

--
-- Table structure for table `driverTypes`
--

CREATE TABLE `driverTypes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `driverTypes`
--

INSERT INTO `driverTypes` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'Freelance', '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(2, 'Warehouse', '2022-07-04 17:21:11', '2022-07-04 17:21:11');

-- --------------------------------------------------------

--
-- Table structure for table `ecommerceCompanies`
--

CREATE TABLE `ecommerceCompanies` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `description` varchar(255) DEFAULT '',
  `charge` float DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ecommerceCompanies`
--

INSERT INTO `ecommerceCompanies` (`id`, `title`, `description`, `charge`, `status`, `deleted`, `createdAt`, `updatedAt`) VALUES
(1, 'amazon', 'description', 2.5, 1, 0, '2023-09-22 10:28:02', '2023-09-22 10:28:02'),
(2, 'Ebay', 'description', 2.5, 1, 0, '2023-09-22 10:28:02', '2023-09-22 10:28:02'),
(3, 'Ali Baba', 'description', 2.5, 1, 0, '2023-09-22 10:28:02', '2023-09-22 10:28:02'),
(4, 'Other', 'description', 2.5, 1, 0, '2023-09-22 10:28:02', '2023-09-22 10:28:02');

-- --------------------------------------------------------

--
-- Table structure for table `FAQs`
--

CREATE TABLE `FAQs` (
  `id` int(11) NOT NULL,
  `title` mediumtext,
  `answer` longtext,
  `status` tinyint(1) DEFAULT '0',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `FAQs`
--

INSERT INTO `FAQs` (`id`, `title`, `answer`, `status`, `deleted`, `createdAt`, `updatedAt`) VALUES
(1, 'How Truck Express Logistica Works?', 'Truck Express work for you and your comfort', 1, 0, '2023-10-02 07:21:43', '2023-10-31 10:00:02'),
(2, 'How to sign up?', 'Truck Express work for edc comfort ', 1, 0, '2023-10-02 07:21:57', '2023-10-04 10:24:25'),
(3, 'aaaa', 'aaaaaaaaaa', 0, 0, '2023-10-16 09:23:00', '2023-10-31 09:45:58');

-- --------------------------------------------------------

--
-- Table structure for table `features`
--

CREATE TABLE `features` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `key` varchar(255) DEFAULT '',
  `featureOf` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `features`
--

INSERT INTO `features` (`id`, `title`, `status`, `key`, `featureOf`, `createdAt`, `updatedAt`) VALUES
(1, 'units', 1, 'units', 'both', '2023-10-13 04:20:18', '2023-10-13 04:20:18'),
(2, 'faqs', 1, 'faqs', 'admin', '2023-10-13 04:21:45', '2023-10-13 04:21:45'),
(3, 'logistic Companyies', 1, 'Logistic Companies', 'admin', '2023-10-13 04:21:45', '2023-10-13 04:21:45'),
(4, 'users', 1, 'users', 'admin', '2023-10-13 04:23:28', '2023-10-13 04:23:28');

-- --------------------------------------------------------

--
-- Table structure for table `generalCharges`
--

CREATE TABLE `generalCharges` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `key` varchar(255) DEFAULT NULL,
  `value` float DEFAULT NULL,
  `information` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `generalCharges`
--

INSERT INTO `generalCharges` (`id`, `title`, `key`, `value`, `information`, `createdAt`, `updatedAt`) VALUES
(1, 'charge', 'WtoVW', 5000, '  Weight to volumetric-weight conversion', '2023-01-03 14:51:00', '2023-10-16 08:57:49'),
(2, 'charge', 'VAT', 0, '  VAT charges (%)', '2023-01-03 14:51:00', '2023-10-16 08:57:56'),
(3, 'charge', 'packing', 0, ' Packing fee', '2023-01-03 14:51:49', '2023-10-16 08:58:01'),
(4, 'charge', 'service', 0, '  Service charges', '2023-01-03 14:51:49', '2023-10-16 08:58:05'),
(5, 'Base Distance for vehicles', 'baseDistance', 3, 'Base distance to calculate driver earnings in miles', '2023-02-08 11:51:10', '2023-10-16 08:58:09');

-- --------------------------------------------------------

--
-- Table structure for table `inTransitGroups`
--

CREATE TABLE `inTransitGroups` (
  `id` int(11) NOT NULL,
  `transitId` varchar(255) DEFAULT NULL,
  `bookingIds` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `setOffDate` date DEFAULT NULL,
  `setOffTime` time DEFAULT NULL,
  `arrivalDate` date DEFAULT NULL,
  `arrivalTime` time DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `logisticCompanyId` int(11) DEFAULT NULL,
  `receivingWarehouseId` int(11) DEFAULT NULL,
  `deliveryWarehouseId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `inTransitGroups`
--

INSERT INTO `inTransitGroups` (`id`, `transitId`, `bookingIds`, `quantity`, `setOffDate`, `setOffTime`, `arrivalDate`, `arrivalTime`, `status`, `createdAt`, `updatedAt`, `logisticCompanyId`, `receivingWarehouseId`, `deliveryWarehouseId`) VALUES
(91, 'TSH-FE5X2RU2AF', '292', 1, '2023-10-31', '18:08:53', '2023-10-31', '18:09:58', 'Delivered', '2023-10-31 13:08:53', '2023-10-31 13:09:58', 1, 2, 3);

-- --------------------------------------------------------

--
-- Table structure for table `links`
--

CREATE TABLE `links` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `key` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `links`
--

INSERT INTO `links` (`id`, `title`, `key`, `link`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Privacy Policy', 'privacyPolicy', 'https://pps507.com/privacy.html', 1, '2023-02-15 15:26:52', '2023-02-15 15:26:52'),
(2, 'FAQs', 'FAQ', 'https://pps507.com', 1, '2023-02-15 15:26:52', '2023-02-15 15:26:52');

-- --------------------------------------------------------

--
-- Table structure for table `logisticCompanies`
--

CREATE TABLE `logisticCompanies` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `description` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `flashCharges` float DEFAULT NULL,
  `standardCharges` float DEFAULT NULL,
  `logo` varchar(255) DEFAULT '',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `logisticCompanies`
--

INSERT INTO `logisticCompanies` (`id`, `title`, `description`, `status`, `flashCharges`, `standardCharges`, `logo`, `deleted`, `createdAt`, `updatedAt`) VALUES
(1, 'FedEx', 'Charge per weight', 1, 600, 500, 'Public/Logos/companyLogo-1697715590221.png', 0, '2023-09-22 10:26:42', '2023-10-31 07:42:56'),
(2, 'DHL', 'Charge per weight', 1, 10, 29.95, 'Public/Logos/companyLogo-1697715612210.png', 0, '2023-10-04 11:08:21', '2023-10-19 12:23:44'),
(3, 'UPS', 'Charge per weight', 1, 54, 32, 'Public/Logos/companyLogo-1697715751365.png', 0, '2023-10-04 11:49:51', '2023-10-19 12:23:50'),
(4, 'Leopards', 'Charge per weight', 1, 48, 12, 'Public/Logos/companyLogo-1697715870990.webp', 0, '2023-10-04 12:53:17', '2023-10-19 12:23:57'),
(5, 'TCS', 'Charge per weight', 1, 50, 10, 'Public/Logos/companyLogo-1697715943526.png', 0, '2023-10-04 12:54:26', '2023-10-19 12:24:03'),
(6, 'Test', 'Charge per weight', 1, 90, 30, 'Public/Logos/companyLogo-1698738254981.jpg', 0, '2023-10-31 07:02:31', '2023-10-31 07:44:15');

-- --------------------------------------------------------

--
-- Table structure for table `logisticCompanyCharges`
--

CREATE TABLE `logisticCompanyCharges` (
  `id` int(11) NOT NULL,
  `startValue` float DEFAULT '0',
  `endValue` float DEFAULT '0',
  `ETA` varchar(255) DEFAULT NULL,
  `charges` decimal(10,2) DEFAULT '0.00',
  `status` tinyint(1) DEFAULT '0',
  `deleted` tinyint(1) DEFAULT '0',
  `flash` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `logisticCompanyId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `logisticCompanyCharges`
--

INSERT INTO `logisticCompanyCharges` (`id`, `startValue`, `endValue`, `ETA`, `charges`, `status`, `deleted`, `flash`, `createdAt`, `updatedAt`, `logisticCompanyId`) VALUES
(1, 50, 100, '4-5', 75.00, 1, 1, 0, '2023-10-12 11:18:40', '2023-10-16 07:09:37', 1),
(2, 0, 50, '5-7', 45.00, 1, 0, 0, '2023-10-12 11:19:28', '2023-10-16 07:10:33', 5),
(3, 51, 100, '2-3', 75.00, 1, 0, 0, '2023-10-13 11:59:07', '2023-10-25 10:55:40', 5),
(4, 101, 1000, '2-3', 105.00, 1, 0, 0, '2023-10-16 06:23:33', '2023-10-25 10:56:02', 5),
(5, 1001, 10000, '10-11', 200.00, 1, 0, 0, '2023-10-16 06:36:20', '2023-10-25 10:56:29', 5),
(6, 0, 50, '5-7', 45.00, 1, 0, 0, '2023-10-12 11:19:28', '2023-10-16 07:10:33', 1),
(7, 51, 100, '2-3', 75.00, 1, 0, 0, '2023-10-13 11:59:07', '2023-10-25 10:55:40', 1),
(8, 101, 1000, '2-3', 105.00, 1, 0, 0, '2023-10-16 06:23:33', '2023-10-25 10:56:02', 1),
(9, 1001, 10000, '10-11', 200.00, 1, 0, 0, '2023-10-16 06:36:20', '2023-10-25 10:56:29', 1),
(10, 0, 50, '5-7', 45.00, 1, 0, 0, '2023-10-12 11:19:28', '2023-10-16 07:10:33', 2),
(11, 51, 100, '2-3', 75.00, 1, 0, 0, '2023-10-13 11:59:07', '2023-10-25 10:55:40', 2),
(12, 101, 1000, '2-3', 105.00, 1, 0, 0, '2023-10-16 06:23:33', '2023-10-25 10:56:02', 2),
(13, 1001, 16000, '10-11', 200.00, 1, 0, 0, '2023-10-16 06:36:20', '2023-10-25 10:56:29', 2);

-- --------------------------------------------------------

--
-- Table structure for table `onGoingOrders`
--

CREATE TABLE `onGoingOrders` (
  `id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `orderNumbers` longtext,
  `sequence` longtext,
  `status` tinyint(1) DEFAULT '0',
  `ordersStatus` varchar(255) DEFAULT '0',
  `isSet` tinyint(1) DEFAULT '0',
  `type` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `onGoingOrders`
--

INSERT INTO `onGoingOrders` (`id`, `date`, `orderNumbers`, `sequence`, `status`, `ordersStatus`, `isSet`, `type`, `createdAt`, `updatedAt`, `userId`) VALUES
(51, '2023-10-31', '282', '282', 1, '16', 1, 'delivery', '2023-10-31 12:55:17', '2023-10-31 12:55:17', 31);

-- --------------------------------------------------------

--
-- Table structure for table `otpVerifications`
--

CREATE TABLE `otpVerifications` (
  `id` int(11) NOT NULL,
  `OTP` varchar(5) DEFAULT NULL,
  `reqAt` datetime DEFAULT NULL,
  `expiryAt` datetime DEFAULT NULL,
  `verifiedInForgetCase` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `otpVerifications`
--

INSERT INTO `otpVerifications` (`id`, `OTP`, `reqAt`, `expiryAt`, `verifiedInForgetCase`, `createdAt`, `updatedAt`, `userId`) VALUES
(1, '78251', '2023-10-04 07:59:04', NULL, 0, '2023-10-04 07:59:04', '2023-10-04 07:59:04', 6),
(2, '78251', '2023-10-04 07:59:04', NULL, 0, '2023-10-04 07:59:04', '2023-10-04 07:59:04', 3),
(3, '64318', '2023-10-11 09:05:27', NULL, 0, '2023-10-11 09:05:27', '2023-10-11 09:05:27', NULL),
(4, '87401', '2023-10-12 05:55:22', NULL, 0, '2023-10-12 05:55:22', '2023-10-12 05:55:22', NULL),
(5, '4606', '2023-10-12 11:51:09', NULL, 0, '2023-10-12 07:20:54', '2023-10-12 11:51:09', 12),
(6, '8003', '2023-10-24 09:07:42', NULL, 0, '2023-10-13 13:25:13', '2023-10-24 09:07:42', 29),
(7, '9007', '2023-10-30 07:16:32', NULL, 0, '2023-10-13 13:28:52', '2023-10-30 07:16:32', 30),
(8, '3326', '2023-10-16 09:03:20', NULL, 0, '2023-10-16 09:03:20', '2023-10-16 09:03:20', 31),
(9, '1280', '2023-10-30 12:00:59', NULL, 0, '2023-10-16 09:38:16', '2023-10-30 12:00:59', 32),
(10, '0295', '2023-10-17 09:27:56', NULL, 0, '2023-10-17 09:27:56', '2023-10-17 09:27:56', NULL),
(11, '1280', '2023-10-17 09:33:10', NULL, 0, '2023-10-17 09:33:10', '2023-10-17 09:33:10', 41),
(12, '5886', '2023-10-17 09:33:40', NULL, 0, '2023-10-17 09:33:40', '2023-10-17 09:33:40', 42),
(13, '6878', '2023-10-17 09:34:32', NULL, 0, '2023-10-17 09:34:32', '2023-10-17 09:34:32', 43),
(14, '1023', '2023-10-17 09:36:23', NULL, 0, '2023-10-17 09:36:23', '2023-10-17 09:36:23', 44),
(15, '7819', '2023-10-17 10:27:54', NULL, 0, '2023-10-17 10:27:54', '2023-10-17 10:27:54', 45),
(16, '7636', '2023-10-18 05:50:29', NULL, 0, '2023-10-18 05:50:29', '2023-10-18 05:50:29', 46),
(17, '3351', '2023-10-30 07:47:02', NULL, 0, '2023-10-18 06:19:07', '2023-10-30 07:47:02', 47),
(18, '2110', '2023-10-18 09:33:21', NULL, 0, '2023-10-18 06:48:56', '2023-10-18 09:33:21', 48),
(19, '7102', '2023-10-18 07:58:03', NULL, 0, '2023-10-18 07:58:03', '2023-10-18 07:58:03', 49),
(20, '0012', '2023-10-18 07:59:17', NULL, 0, '2023-10-18 07:59:17', '2023-10-18 07:59:17', 50),
(21, '4761', '2023-10-18 10:38:58', NULL, 0, '2023-10-18 08:01:15', '2023-10-18 10:38:58', 51),
(22, '6515', '2023-10-20 10:42:11', NULL, 0, '2023-10-20 10:42:11', '2023-10-20 10:42:11', 58),
(23, '9512', '2023-10-24 09:10:16', NULL, 0, '2023-10-24 09:10:16', '2023-10-24 09:10:16', 59),
(24, '2931', '2023-10-24 09:20:10', NULL, 0, '2023-10-24 09:20:10', '2023-10-24 09:20:10', 60),
(25, '9323', '2023-10-25 04:36:21', NULL, 0, '2023-10-25 04:36:21', '2023-10-25 04:36:21', 56),
(26, '0841', '2023-10-26 07:10:16', NULL, 0, '2023-10-26 07:10:16', '2023-10-26 07:10:16', NULL),
(27, '3593', '2023-10-27 05:42:47', NULL, 0, '2023-10-26 07:22:04', '2023-10-27 05:42:47', 62),
(28, '6173', '2023-10-26 10:11:56', NULL, 0, '2023-10-26 10:11:56', '2023-10-26 10:11:56', 64),
(29, '2659', '2023-10-26 13:58:34', NULL, 0, '2023-10-26 11:48:13', '2023-10-26 13:58:34', 65),
(30, '0274', '2023-10-27 10:25:39', NULL, 0, '2023-10-26 11:49:20', '2023-10-27 10:25:39', 55),
(31, '6722', '2023-10-26 11:51:33', NULL, 0, '2023-10-26 11:51:33', '2023-10-26 11:51:33', 66),
(32, '5019', '2023-10-26 11:57:36', NULL, 0, '2023-10-26 11:57:36', '2023-10-26 11:57:36', 67),
(33, '9575', '2023-10-26 13:21:31', NULL, 0, '2023-10-26 13:21:31', '2023-10-26 13:21:31', 68),
(34, '8042', '2023-10-26 13:21:32', NULL, 0, '2023-10-26 13:21:32', '2023-10-26 13:21:32', 69),
(35, '7716', '2023-10-26 13:32:43', NULL, 0, '2023-10-26 13:32:43', '2023-10-26 13:32:43', 70),
(36, '7526', '2023-10-27 10:45:17', NULL, 0, '2023-10-27 10:45:17', '2023-10-27 10:45:17', 72),
(37, '0151', '2023-10-27 10:45:21', NULL, 0, '2023-10-27 10:45:21', '2023-10-27 10:45:21', 73),
(38, '7490', '2023-10-27 11:04:23', NULL, 0, '2023-10-27 11:04:23', '2023-10-27 11:04:23', 74),
(39, '0356', '2023-10-27 11:20:19', NULL, 0, '2023-10-27 11:20:19', '2023-10-27 11:20:19', 75),
(40, '4754', '2023-10-27 12:06:11', NULL, 0, '2023-10-27 11:31:54', '2023-10-27 12:06:11', 76),
(41, '1586', '2023-10-27 13:04:31', NULL, 0, '2023-10-27 13:04:31', '2023-10-27 13:04:31', 77),
(42, '0190', '2023-10-27 13:24:21', NULL, 0, '2023-10-27 13:24:21', '2023-10-27 13:24:21', 78),
(43, '9271', '2023-10-27 13:51:16', NULL, 0, '2023-10-27 13:51:16', '2023-10-27 13:51:16', 79),
(44, '5603', '2023-10-27 14:42:57', NULL, 0, '2023-10-27 14:42:57', '2023-10-27 14:42:57', 80),
(45, '0120', '2023-11-01 02:57:13', NULL, 0, '2023-10-30 12:30:25', '2023-11-01 02:58:11', 81);

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `trackingNum` varchar(1024) DEFAULT '',
  `name` varchar(1024) DEFAULT '',
  `email` varchar(1024) DEFAULT '',
  `phone` varchar(1024) DEFAULT '',
  `weight` decimal(12,2) DEFAULT '0.00',
  `length` decimal(12,2) DEFAULT '0.00',
  `width` decimal(12,2) DEFAULT '0.00',
  `height` decimal(12,2) DEFAULT '0.00',
  `volume` decimal(15,2) DEFAULT '0.00',
  `deliveryDate` date DEFAULT NULL,
  `note` varchar(1024) DEFAULT '',
  `barcode` varchar(1024) DEFAULT '',
  `catText` varchar(255) DEFAULT '',
  `total` decimal(10,2) DEFAULT '0.00',
  `status` tinyint(1) DEFAULT '1',
  `arrived` enum('neverArrived','pending','arrived') DEFAULT 'pending',
  `actualWeight` decimal(12,2) DEFAULT '0.00',
  `actualLength` decimal(12,2) DEFAULT '0.00',
  `actualWidth` decimal(12,2) DEFAULT '0.00',
  `actualHeight` decimal(12,2) DEFAULT '0.00',
  `actualVolume` decimal(15,2) DEFAULT '0.00',
  `ETA` date DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `logisticCompanyTrackingNum` varchar(1024) DEFAULT NULL,
  `bookingId` int(11) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `ecommerceCompanyId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `packages`
--

INSERT INTO `packages` (`id`, `trackingNum`, `name`, `email`, `phone`, `weight`, `length`, `width`, `height`, `volume`, `deliveryDate`, `note`, `barcode`, `catText`, `total`, `status`, `arrived`, `actualWeight`, `actualLength`, `actualWidth`, `actualHeight`, `actualVolume`, `ETA`, `createdAt`, `updatedAt`, `logisticCompanyTrackingNum`, `bookingId`, `categoryId`, `ecommerceCompanyId`) VALUES
(1, '21323', 'ali', 'ali@gmail.com', '223422323', 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, '', NULL, 0.00, 1, 'arrived', 1.00, 1.00, 1.00, 1.00, 1.00, '2023-07-13', '2023-10-04 09:09:30', '2023-10-16 12:50:19', NULL, 291, 2, 1),
(2, '21323', 'arsal', 'arsal@gmail.com', '4533623', 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, '', NULL, 0.00, 1, 'arrived', 12.00, 21.00, 23.00, 42.00, 0.00, '2023-07-13', '2023-10-04 09:09:30', '2023-10-04 09:09:30', NULL, 293, 16, 1),
(482, '5', 'a', 'ab@gmail.com', '+164648585613', 8.00, 5.00, 7.00, 7.00, 245.00, NULL, '', '', 'catText', 0.00, 1, 'arrived', 0.00, 0.00, 0.00, 0.00, 0.00, '2023-10-31', '2023-10-31 10:31:15', '2023-10-31 10:33:57', NULL, 290, 2, 2),
(483, '68666', 'hhjhhk', 'abcd@gmail.com', '+146464554545', 6.00, 3.00, 5.00, 9.00, 135.00, NULL, 'svvsvs', '', 'catText', 0.00, 1, 'arrived', 4500.00, 12.00, 23.00, 34.00, 9384.00, '2023-10-31', '2023-10-31 13:07:25', '2023-10-31 13:07:52', NULL, 292, 1, 1),
(484, '25865', 'cnhfjfj', 'abcd@gmail.com', '+168986686858', 9.00, 3.00, 56.00, 9.00, 1512.00, NULL, 'dbbcch', '', 'catText', 0.00, 1, 'arrived', 45.00, 12.00, 23.00, 34.00, 9384.00, '2023-10-31', '2023-10-31 13:10:53', '2023-10-31 13:11:27', NULL, 293, 2, 3);

-- --------------------------------------------------------

--
-- Table structure for table `paymentRequests`
--

CREATE TABLE `paymentRequests` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `status` varchar(255) DEFAULT '0',
  `type` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `paymentRequests`
--

INSERT INTO `paymentRequests` (`id`, `amount`, `status`, `type`, `date`, `time`, `createdAt`, `updatedAt`, `userId`) VALUES
(1, 0.00, 'done', 'withdraw', '2023-10-13', '16:48:15', '2023-10-13 11:48:15', '2023-10-13 11:48:15', 5),
(2, 100.00, 'done', 'withdraw', '2023-10-13', '16:48:23', '2023-10-13 11:48:23', '2023-10-13 11:48:23', 5);

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `permissionType` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `featureId` int(11) DEFAULT NULL,
  `roleId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `permissionType`, `createdAt`, `updatedAt`, `featureId`, `roleId`) VALUES
(17, 'create', '2023-10-13 06:37:20', '2023-10-13 06:37:20', 1, 2),
(18, 'create', '2023-10-13 06:37:20', '2023-10-13 06:37:20', 2, 2),
(19, 'create', '2023-10-13 06:37:20', '2023-10-13 06:37:20', 3, 2),
(20, 'create', '2023-10-13 06:37:20', '2023-10-13 06:37:20', 4, 2),
(21, 'create', '2023-10-13 08:00:46', '2023-10-13 08:00:46', 1, 1),
(22, 'read', '2023-10-13 08:00:46', '2023-10-13 08:00:46', 1, 1),
(23, 'create', '2023-10-13 08:00:46', '2023-10-13 08:00:46', 2, 1),
(24, 'read', '2023-10-13 08:00:46', '2023-10-13 08:00:46', 2, 1),
(25, 'create', '2023-10-13 08:00:46', '2023-10-13 08:00:46', 3, 1),
(26, 'read', '2023-10-13 08:00:46', '2023-10-13 08:00:46', 3, 1),
(27, 'read', '2023-10-13 08:00:46', '2023-10-13 08:00:46', 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `postponedOrders`
--

CREATE TABLE `postponedOrders` (
  `id` int(11) NOT NULL,
  `reasonDesc` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `bookingId` int(11) DEFAULT NULL,
  `reasonId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `pushNotifications`
--

CREATE TABLE `pushNotifications` (
  `id` int(11) NOT NULL,
  `at` datetime DEFAULT NULL,
  `to` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `body` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `pushNotifications`
--

INSERT INTO `pushNotifications` (`id`, `at`, `to`, `title`, `body`, `createdAt`, `updatedAt`) VALUES
(1, '2023-10-16 12:15:29', 'all', 'Annoucment', 'Important notice', '2023-10-16 07:15:29', '2023-10-16 07:15:29'),
(2, '2023-10-16 12:20:15', 'customers', 'Hey', 'Hi there', '2023-10-16 07:20:15', '2023-10-16 07:20:15'),
(3, '2023-10-25 11:33:30', 'all', 'Hello', 'message', '2023-10-25 06:33:30', '2023-10-25 06:33:30'),
(4, '2023-10-25 12:18:52', 'all', 'Hi', 'hey there', '2023-10-25 07:18:52', '2023-10-25 07:18:52'),
(5, '2023-10-25 13:05:03', 'all', 'Annoucment', 'important notice', '2023-10-25 08:05:03', '2023-10-25 08:05:03'),
(6, '2023-10-25 13:05:37', 'all', 'Annoucment', 'important notice', '2023-10-25 08:05:37', '2023-10-25 08:05:37');

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `value` int(11) DEFAULT '0',
  `comment` varchar(255) DEFAULT '',
  `at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `bookingId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `reasons`
--

CREATE TABLE `reasons` (
  `id` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `reasons`
--

INSERT INTO `reasons` (`id`, `reason`, `createdAt`, `updatedAt`) VALUES
(1, 'test1', '2023-10-11 12:01:06', '2023-10-11 12:01:06'),
(2, 'test2', '2023-10-11 12:01:06', '2023-10-11 12:01:06'),
(4, 'test3', '2023-10-11 12:22:37', '2023-10-11 12:22:37'),
(5, 'test3', '2023-10-11 12:23:54', '2023-10-11 12:23:54'),
(6, 'test3', '2023-10-11 12:24:19', '2023-10-11 12:24:19'),
(7, 'test3', '2023-10-11 12:25:49', '2023-10-11 12:25:49'),
(8, 'test3', '2023-10-11 12:28:28', '2023-10-11 12:28:28'),
(9, 'test3', '2023-10-11 12:29:59', '2023-10-11 12:29:59'),
(10, 'other', '2023-10-12 04:53:50', '2023-10-12 04:53:50');

-- --------------------------------------------------------

--
-- Table structure for table `restrictedItems`
--

CREATE TABLE `restrictedItems` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `image` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `warehouseId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `status`, `createdAt`, `updatedAt`, `warehouseId`) VALUES
(1, 'Supervisor', 1, '2023-10-12 12:36:02', '2023-10-13 08:00:46', NULL),
(2, 'IT Guy', 1, '2023-10-13 06:37:20', '2023-10-13 06:37:20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `shipmentTypes`
--

CREATE TABLE `shipmentTypes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `description` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `charge` float DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `shipmentTypes`
--

INSERT INTO `shipmentTypes` (`id`, `title`, `description`, `status`, `charge`, `createdAt`, `updatedAt`) VALUES
(1, 'Flash Delivery', 'Dummy Text', 1, NULL, '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(2, 'Standard Delivery', 'Dummy Text', 1, NULL, '2022-07-04 17:21:11', '2022-07-04 17:21:11');

-- --------------------------------------------------------

--
-- Table structure for table `structQuestions`
--

CREATE TABLE `structQuestions` (
  `id` int(11) NOT NULL,
  `question` text,
  `label` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `structureTypeId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `structureTypes`
--

CREATE TABLE `structureTypes` (
  `id` int(11) NOT NULL,
  `icon` varchar(255) DEFAULT '',
  `title` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `supports`
--

CREATE TABLE `supports` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `key` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `supports`
--

INSERT INTO `supports` (`id`, `title`, `key`, `value`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'email', 'support_email', 'support@gmail.com', 1, '2023-02-06 10:51:06', '2023-10-19 06:33:00'),
(2, 'phone', 'support_phone', '+929007860113', 1, '2023-02-06 10:51:06', '2023-10-19 06:33:12');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` int(11) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `symbol` varchar(255) DEFAULT NULL,
  `desc` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `conversionRate` decimal(8,4) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `type`, `name`, `symbol`, `desc`, `status`, `conversionRate`, `deleted`, `createdAt`, `updatedAt`) VALUES
(1, 'length', 'inch', 'in', NULL, 1, 1.0000, 0, '2023-08-09 09:55:36', '2023-10-12 12:43:49'),
(2, 'weight', 'lbs', 'lbs', NULL, 1, 1.0000, 0, '2023-08-09 09:56:11', '2023-10-12 10:18:01'),
(3, 'distance', 'kilometer', 'km', NULL, 1, 1.0000, 0, '2023-08-09 09:58:17', '2023-08-09 09:58:17'),
(4, 'currency', 'USD', '$', NULL, 1, 1.0000, 0, '2023-08-09 09:58:50', '2023-10-12 12:43:28'),
(5, 'length', 'cm', 'cm', NULL, 1, 1.0000, 0, '2023-10-12 10:29:20', '2023-10-12 10:29:20'),
(6, 'weight', 'kilogram', 'kg', NULL, 1, 0.4536, 0, '2023-08-09 09:56:11', '2023-10-12 10:18:01');

-- --------------------------------------------------------

--
-- Table structure for table `userAddresses`
--

CREATE TABLE `userAddresses` (
  `id` int(11) NOT NULL,
  `default` tinyint(1) DEFAULT '1',
  `status` tinyint(1) DEFAULT '1',
  `deleted` tinyint(1) DEFAULT '0',
  `type` varchar(1024) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `addressDBId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `userAddresses`
--

INSERT INTO `userAddresses` (`id`, `default`, `status`, `deleted`, `type`, `createdAt`, `updatedAt`, `addressDBId`, `userId`) VALUES
(2, 1, 1, 0, 'pickup', '2023-10-04 09:33:28', '2023-10-04 09:33:28', 3, 3),
(3, 1, 1, 0, 'dropoff', '2023-10-05 10:39:44', '2023-10-05 10:39:44', 4, 6),
(4, 1, 1, 0, 'dropoff', '2023-10-05 10:41:55', '2023-10-05 10:41:55', 5, 6),
(5, 1, 1, 0, 'dropoff', '2023-10-05 10:44:07', '2023-10-05 10:44:07', 6, 6),
(6, 1, 1, 0, 'dropoff', '2023-10-05 10:49:05', '2023-10-05 10:49:05', 7, 6),
(7, 1, 1, 0, 'dropoff', '2023-10-05 10:49:39', '2023-10-05 10:49:39', 8, 6),
(8, 1, 1, 0, 'dropoff', '2023-10-05 10:50:41', '2023-10-05 10:50:41', 9, 6),
(9, 1, 1, 0, 'dropoff', '2023-10-05 10:51:42', '2023-10-05 10:51:42', 10, 6),
(10, 1, 1, 0, 'dropoff', '2023-10-05 10:54:24', '2023-10-05 10:54:24', 11, 6),
(11, 1, 1, 0, 'dropoff', '2023-10-05 10:54:38', '2023-10-05 10:54:38', 12, 6),
(12, 1, 1, 0, 'dropoff', '2023-10-05 10:55:12', '2023-10-05 10:55:12', 13, 6),
(13, 1, 1, 0, 'dropoff', '2023-10-05 10:56:25', '2023-10-05 10:56:25', 14, 6),
(14, 1, 1, 0, 'dropoff', '2023-10-05 10:56:54', '2023-10-05 10:56:54', 15, 6),
(15, 1, 1, 0, 'dropoff', '2023-10-05 11:24:10', '2023-10-05 11:24:10', 16, 6),
(16, 1, 1, 0, 'dropoff', '2023-10-09 06:06:40', '2023-10-09 06:06:40', 17, 3),
(17, 1, 1, 0, 'dropoff', '2023-10-09 07:38:19', '2023-10-09 07:38:19', 21, 3),
(18, 1, 1, 0, 'dropoff', '2023-10-09 07:52:55', '2023-10-09 07:52:55', NULL, 3),
(19, 1, 1, 0, 'dropoff', '2023-10-09 07:58:19', '2023-10-09 07:58:19', 36, 3),
(20, 1, 1, 0, 'dropoff', '2023-10-11 09:48:54', '2023-10-11 09:48:54', 37, NULL),
(21, 1, 1, 0, 'dropoff', '2023-10-11 11:42:05', '2023-10-11 11:42:05', 38, NULL),
(22, 1, 1, 0, 'pickup', '2023-10-12 10:23:36', '2023-10-12 10:23:36', 39, NULL),
(23, 1, 1, 0, 'dropoff', '2023-10-12 10:25:55', '2023-10-12 10:25:55', 40, NULL),
(31, 1, 1, 0, 'dropoff', '2023-10-13 13:14:17', '2023-10-13 13:14:17', 50, 12),
(32, 1, 1, 0, 'dropoff', '2023-10-13 13:14:41', '2023-10-13 13:14:41', 51, 12),
(33, 1, 1, 0, 'dropoff', '2023-10-16 10:18:16', '2023-10-16 10:18:16', 52, 32),
(34, 1, 1, 0, 'dropoff', '2023-10-16 10:20:16', '2023-10-16 10:20:16', 53, 32),
(35, 1, 1, 0, 'dropoff', '2023-10-16 10:20:56', '2023-10-16 10:20:56', 54, 32),
(36, 1, 1, 0, 'dropoff', '2023-10-16 10:21:13', '2023-10-16 10:21:13', 55, 32),
(37, 1, 1, 0, 'dropoff', '2023-10-16 10:28:34', '2023-10-16 10:28:34', 56, 32),
(38, 1, 1, 0, 'dropoff', '2023-10-16 10:28:39', '2023-10-16 10:28:39', 57, 32),
(39, 1, 1, 0, 'dropoff', '2023-10-16 10:39:27', '2023-10-16 10:39:27', 58, 32),
(40, 1, 1, 0, 'dropoff', '2023-10-16 10:39:45', '2023-10-16 10:39:45', 59, 32),
(41, 1, 1, 0, 'dropoff', '2023-10-16 10:40:15', '2023-10-16 10:40:15', 60, 32),
(42, 1, 1, 0, 'dropoff', '2023-10-16 10:42:07', '2023-10-16 10:42:07', 61, 32),
(43, 1, 1, 0, 'dropoff', '2023-10-16 11:24:55', '2023-10-16 11:24:55', 62, 32),
(44, 1, 1, 0, 'dropoff', '2023-10-16 12:02:10', '2023-10-16 12:02:10', 63, 32),
(45, 1, 1, 0, 'dropoff', '2023-10-16 12:02:39', '2023-10-16 12:02:39', 64, 32),
(46, 1, 1, 0, 'dropoff', '2023-10-17 10:16:22', '2023-10-17 10:16:22', 68, 44),
(47, 1, 1, 0, 'pickup', '2023-10-18 07:23:52', '2023-10-18 07:23:52', 69, 47),
(48, 1, 1, 0, 'dropoff', '2023-10-18 07:54:12', '2023-10-18 07:54:12', 70, 32),
(49, 1, 1, 0, 'pickup', '2023-10-18 12:01:55', '2023-10-18 12:01:55', 71, 47),
(50, 1, 1, 0, 'pickup', '2023-10-18 12:02:33', '2023-10-18 12:02:33', 72, 47),
(51, 1, 1, 0, 'dropoff', '2023-10-18 12:03:50', '2023-10-18 12:03:50', 73, 47),
(52, 1, 1, 0, 'dropoff', '2023-10-18 12:04:44', '2023-10-18 12:04:44', 74, 47),
(53, 1, 1, 0, 'pickup', '2023-10-18 12:05:14', '2023-10-18 12:05:14', 75, 47),
(54, 1, 1, 0, 'dropoff', '2023-10-20 10:48:10', '2023-10-20 10:48:10', 76, 58),
(55, 1, 1, 0, 'dropoff', '2023-10-24 09:32:08', '2023-10-24 09:32:08', 77, 32),
(56, 1, 1, 0, 'dropoff', '2023-10-24 09:32:11', '2023-10-24 09:32:11', 78, 32),
(57, 1, 1, 0, 'dropoff', '2023-10-24 09:33:06', '2023-10-24 09:33:06', 79, 60),
(58, 1, 1, 0, 'dropoff', '2023-10-24 09:35:59', '2023-10-24 09:35:59', 80, 60),
(59, 1, 1, 0, 'dropoff', '2023-10-24 09:38:41', '2023-10-24 09:38:41', 81, 60),
(60, 1, 1, 0, 'dropoff', '2023-10-24 09:39:55', '2023-10-24 09:39:55', 82, 60),
(61, 1, 1, 0, 'dropoff', '2023-10-24 09:58:05', '2023-10-24 09:58:05', 84, 60),
(62, 1, 1, 0, 'dropoff', '2023-10-24 11:13:26', '2023-10-24 11:13:26', 85, 60),
(63, 1, 1, 0, 'dropoff', '2023-10-24 11:34:40', '2023-10-24 11:34:40', 86, 60),
(64, 1, 1, 0, 'dropoff', '2023-10-24 13:08:58', '2023-10-24 13:08:58', 105, 47),
(65, 1, 1, 0, 'dropoff', '2023-10-24 13:14:31', '2023-10-24 13:14:31', 106, 47),
(66, 1, 1, 0, 'dropoff', '2023-10-24 13:15:07', '2023-10-24 13:15:07', 107, 47),
(67, 1, 1, 0, 'dropoff', '2023-10-25 05:08:18', '2023-10-25 05:08:18', 110, 56),
(68, 1, 1, 0, 'dropoff', '2023-10-25 07:56:30', '2023-10-25 07:56:30', 125, 56),
(69, 1, 1, 0, 'dropoff', '2023-10-26 10:14:35', '2023-10-26 10:14:35', 127, 60),
(70, 1, 1, 0, 'dropoff', '2023-10-26 10:17:58', '2023-10-26 10:17:58', 131, 60),
(71, 1, 1, 0, 'dropoff', '2023-10-26 10:19:56', '2023-10-26 10:19:56', 132, 63),
(72, 1, 1, 0, 'dropoff', '2023-10-26 10:21:48', '2023-10-26 10:21:48', 134, 63),
(73, 1, 1, 0, 'dropoff', '2023-10-26 10:22:34', '2023-10-26 10:22:34', 135, 63),
(74, 1, 1, 0, 'dropoff', '2023-10-26 11:59:53', '2023-10-26 11:59:53', 138, 66),
(75, 1, 1, 0, 'dropoff', '2023-10-26 13:38:33', '2023-10-26 13:38:33', 142, 68),
(76, 1, 1, 0, 'dropoff', '2023-10-26 13:39:49', '2023-10-26 13:39:49', 143, 68),
(77, 1, 1, 0, 'dropoff', '2023-10-26 13:53:50', '2023-10-26 13:53:50', 144, 68),
(78, 1, 1, 0, 'dropoff', '2023-10-26 13:54:54', '2023-10-26 13:54:54', 145, 68),
(79, 1, 1, 0, 'dropoff', '2023-10-27 06:38:40', '2023-10-27 06:38:40', 147, 62),
(80, 1, 1, 0, 'dropoff', '2023-10-27 07:45:13', '2023-10-27 07:45:13', 150, 32),
(81, 1, 1, 0, 'pickup', '2023-10-31 09:37:47', '2023-10-31 09:37:47', 157, 47),
(82, 1, 1, 0, 'pickup', '2023-10-31 09:38:32', '2023-10-31 09:38:32', 158, 47),
(83, 1, 1, 0, 'dropoff', '2023-10-31 09:56:14', '2023-10-31 09:56:14', 159, 47);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstName` varchar(255) DEFAULT '',
  `lastName` varchar(255) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `countryCode` varchar(16) DEFAULT NULL,
  `phoneNum` varchar(72) DEFAULT '',
  `password` varchar(255) DEFAULT '',
  `virtualBox` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '1',
  `verifiedAt` datetime DEFAULT NULL,
  `stripeCustomerId` varchar(255) DEFAULT '',
  `dvToken` varchar(255) DEFAULT '',
  `image` varchar(255) DEFAULT '',
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userTypeId` int(11) DEFAULT NULL,
  `signedFrom` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `email`, `countryCode`, `phoneNum`, `password`, `virtualBox`, `status`, `verifiedAt`, `stripeCustomerId`, `dvToken`, `image`, `deletedAt`, `createdAt`, `updatedAt`, `userTypeId`, `signedFrom`) VALUES
(1, '', '', 'guestuser@gmail.com', NULL, '', '', '', 1, '2023-10-04 16:13:02', 'cus_OnB0g22kN2xSpm', '', '', NULL, '2022-07-04 17:21:11', '2023-10-30 04:49:02', 2, ''),
(2, 'Asad', 'Ali', 'arba32b@gmail.com', '92', '292828822', '$2b$10$ZZNEX5MVeDTJ0iAfK0T.oOSNnyOgLBcmymBbWPOwbSjxOSqtWPJiq', '', 0, '2023-10-02 00:00:00', 'cus_OnB0g22kN2xSpm', '', 'Public/Profile/profile-1696230988423.png', '2023-10-31 11:28:04', '2023-10-02 07:16:28', '2023-10-31 11:28:04', 2, ''),
(3, 'customer', 'new', 'customer@gmail.com', '92', '292828822321', '$2b$10$d./2Wtb1XvMzjqpgJJzmleAHh3ex1KK4RCyfn/O69pCSV0V4kVpES', '12345', 0, '2023-10-02 00:00:00', 'cus_OnB0g22kN2xSpm', '', 'Public/Profile/profile-1696230988423.png', '2023-10-31 05:35:18', '2023-10-02 07:16:28', '2023-10-31 05:35:18', 1, ''),
(4, 'Test', 'Driver', 'test@gmail.com', '+507', '324444442', '$2b$10$bHUtCVM5utZthbSBX28PY.yEWzQQMIDq0KyvszIfuOgqdU73yNP/.', '', 1, '2023-10-03 00:00:00', 'cus_OnB0g22kN2xSpm', '', 'Public/Profile/profile-1696336411987.jpg', NULL, '2023-10-03 12:33:34', '2023-10-27 11:22:06', 2, ''),
(5, 'Arbab', 'Hassan', 'arba32b2@gmail.com', '92', '2928288221', '$2b$10$oSylWyEZUd5/UqGh.fhyMOXKen3m/Ia4KLVZ24k.bwmKNa.Z0iNwC', '', 1, '2023-10-03 00:00:00', 'cus_OnB0g22kN2xSpm', '', 'Public/Profile/profile-1696336799457.jpg', NULL, '2023-10-03 12:39:59', '2023-10-06 06:48:46', 2, ''),
(6, 'Asad', 'Ali', 'wajeeh438@gmail.com', '+92', '3055071423', '$2b$10$Z/wLLhkHPb/NV8jfxmdTUesEJHcafYAAkfwpILhjWz2zacfaAMB4u', '22345', 1, '2023-10-19 12:30:56', 'cus_OqccwCzFNaK4Eg', '', 'Public/Profile/profile-6-1696501659261.png', NULL, '2023-10-04 07:59:03', '2023-10-31 06:24:01', 1, ''),
(7, 'Demo', 'Driver', 'demo@gmail.com', '+507', '3001122112', '$2b$10$IzjQYm4UrjecG5f6TJSEWu4dPt3W.rD4yitdrBcSbfqMCvaCgDGou', '', 1, '2023-10-06 00:00:00', 'cus_OnB0g22kN2xSpm', '', 'Public/Profile/profile-1696572389648.jpg', NULL, '2023-10-06 06:06:30', '2023-10-06 06:08:14', 2, ''),
(10, 'Furqan', 'Ahmad', 'furqan2@gmail.com', '92', '38549841585', '$2b$10$HWZm42Xi8L0L2PVMPYiA3O1AsFRl/8y99a.ISXbv47.xy5w2wnkHu', '', 0, '2023-10-11 19:00:00', '', '', 'Public/Images/Profile/profile-1697093074240.png', NULL, '2023-10-12 06:44:34', '2023-10-12 06:44:34', 2, ''),
(12, 'New', 'driver', 'ab@gmail.com', '92', '38549841584', '$2b$10$77A0pFdLk3T69ChfmVVlWetnCKjkha.BGEgZWfpvTp7ASEFLuZaRe', '', 1, '2023-10-12 07:21:01', 'cus_Onv2fPINDctCIk', '', 'Public/Profile/profile-undefined-1697110182107.jpg', NULL, '2023-10-12 07:20:53', '2023-10-31 10:12:52', 1, ''),
(19, 'arsal', 'gta', 'arsal@gmail.com', '+507', '3254687411111', '$2b$10$iNPEuOvmN9fgftoDQR62Guo0Q9sCaEtBcmAdlET986TeNNjerdSoa', '', 1, '2023-10-11 19:00:00', '', '', 'Public/Images/Profile/profile-1697104864177.jpg', NULL, '2023-10-12 10:01:05', '2023-10-17 10:40:56', 2, ''),
(23, 'Furqan', 'Ahmad', 'furqan21@gmail.com', '92', '385498415851', '$2b$10$rQXx0Ym2LQgA1aHboIs3oOAyf9.w/.9QlZA.Yt9jy0w8DMuJt8X4K', '', 1, '2023-10-11 19:00:00', '', '', 'Public/Images/Profile/profile-1697115906556.png', NULL, '2023-10-12 13:05:06', '2023-10-13 08:07:15', 2, ''),
(27, 'Ali', 'Naseer', 'alinaseer@gmail.com', '+92', '32546874445323', '$2b$10$ES3Jq9D6eSctg86R5V1v1uYkqEVPei.biDO3BG16nNFpxkOKmtLy2', '', 1, '2023-10-12 19:00:00', '', '', 'Public/Images/Profile/profile-1697176675504.png', NULL, '2023-10-13 05:57:56', '2023-10-13 06:23:56', 2, ''),
(28, 'kkkk', 'kkkk', 'kkkk', '+507', '1234', '$2b$10$/BNPH.Mw6x5PBPsiFsEafuoBueieGrkLM6kkSjm5RWu02gHAgck3q', '', 1, '2023-10-13 00:00:00', '', '', 'Public/Profile/profile-1697197963623.png', NULL, '2023-10-13 11:52:44', '2023-10-13 11:54:38', 2, ''),
(29, '', '', 'zeeshannawaz331@gmail.com', NULL, '', '$2b$10$zvnkD4nfSQn1nVh/4Qx7/u5SYnXQPvRDoVAWjqWCxh/z1OxCyeAqu', '', 1, '2023-10-24 09:08:40', 'cus_OsRUFpSmUSqZNi', '', '', NULL, '2023-10-13 13:25:12', '2023-10-24 09:08:40', 1, ''),
(30, '', '', 'abc@gmail.com', NULL, '', '$2b$10$nVvhFLm93JO3hAwD/v6RTuCkE2v/GKTrLs3iBdGW.a6zC./R.WmPi', '', 1, NULL, '', '', '', NULL, '2023-10-13 13:28:51', '2023-10-13 13:28:51', 1, ''),
(31, 'wajeeh', 'hassan', 'yyz@gmail.com', '+92', '3071234568', '$2b$10$X/aAJSYwA1cL3.JxXrFGEuAVkD6iP4fZtCWn8oqRAqFwcFJCb7z..', '', 1, '2023-10-16 09:03:49', '', '', 'Public/Profile/profile-1697446999945.png', NULL, '2023-10-16 09:03:20', '2023-10-16 09:03:49', 2, ''),
(32, 'Danish', 'Ali', 'danish@gmail.com', '+507', '68686886866', '$2b$10$Z/wLLhkHPb/NV8jfxmdTUesEJHcafYAAkfwpILhjWz2zacfaAMB4u', '', 1, '2023-10-16 09:38:23', 'cus_OpSArdRoUFou74', '', 'Public/Profile/profile-32-1697449134142.jpg', NULL, '2023-10-16 09:38:15', '2023-10-16 09:38:55', 1, ''),
(41, '', '', 'mtahooddrali@gmail.com', NULL, '', '$2b$10$hQ30MHL0IIz7qptRhNbavuGd/WwpHGKmPYEBGN/fWJ0bPt.5km4ny', '', 1, NULL, '', '', '', NULL, '2023-10-17 09:33:09', '2023-10-17 09:33:09', 1, ''),
(42, '', '', 'aa@gmail.com', NULL, '', '$2b$10$PguxpimYudwtIv5POTPWdu/HuYTkLXBklp2ekRXi2FYlAqa95QeHK', '', 1, '2023-10-17 09:34:13', 'cus_OppJwUjClcVCIg', '', '', NULL, '2023-10-17 09:33:40', '2023-10-17 09:34:13', 1, ''),
(43, '', '', 'abab@gmail.com', NULL, '', '$2b$10$8bMr9p5V.ZDHulgqtuK3H.FfAPOGJYdJjoiVPUvTd2gyMFZl4xggK', '', 1, '2023-10-17 09:34:41', 'cus_OppKFUnWuCzxC0', '', '', NULL, '2023-10-17 09:34:31', '2023-10-17 09:34:41', 1, ''),
(44, 'kiran', 'testing', 'kiran@testing.com', '+507', '12434549865', '$2b$10$9mvC38dSdareQUXEGEPFAOohktJ44D2fm7Jx1xVf1ApJXgV1rFoJO', '', 1, '2023-10-17 09:36:36', 'cus_OppMpP3STCewvF', '', 'Public/Profile/profile-44-1697535443298.jpg', NULL, '2023-10-17 09:36:22', '2023-10-17 09:37:24', 1, ''),
(45, 'test', 'ttt', 'test1@gmail.com', '+507', '1234567689', '$2b$10$3ItO468.c3vDA0FwyT1V.u7mXzGojL460KcxlRTohmIrWQyirGYLu', '', 1, '2023-10-17 10:27:57', '', '', 'Public/Profile/profile-1697538472491.jpg', NULL, '2023-10-17 10:27:53', '2023-10-17 10:27:57', 2, ''),
(46, '', '', 'sigitesing5@gmail.com', NULL, '', '$2b$10$YsCE3rhV5Cv0VkrH5itZMeHkiXvQYdOeTTEFOin8TXQ/y5A.W.h4m', '', 1, NULL, '', '', '', NULL, '2023-10-18 05:50:28', '2023-10-18 05:50:28', 1, ''),
(47, 'Kiran', 'testing', 'sigitesting5@gmail.com', '+507', '51243454646', '$2b$10$wsBzpwLYZeB06zeJ1tUr/eRrVUklnvDT9Y9z/6qSefTCmScPdAFtC', '', 1, '2023-10-18 06:36:06', 'cus_Oq9fK8GV4grG8s', '', 'Public/Profile/profile-undefined-1697626673542.jpg', NULL, '2023-10-18 06:19:06', '2023-10-20 05:48:56', 1, ''),
(48, '', '', 'mtahli@gmail.com', NULL, '', '$2b$10$h8K8GL1biJqgTRD5lvqace4wlNX85JunbuvGBE0csOjE1KvT6aBjS', '', 1, NULL, '', '', '', NULL, '2023-10-18 06:48:56', '2023-10-18 06:48:56', 1, ''),
(49, '', '', 'mtahsli@gmail.com', NULL, '', '$2b$10$Pk37f5Q3kuAQhEFnGbSa2.FQMOoayQpGVhcJvX6oEg4nY/unTNTwq', '', 1, NULL, '', '', '', NULL, '2023-10-18 07:58:01', '2023-10-18 07:58:01', 1, ''),
(50, '', '', 'ag@gmail.com', NULL, '', '$2b$10$3tfRzTaTJQhd1uhfRi66AOz/N4ZmCd/zMebf6b0EkcVBPdyXOVZlC', '', 1, NULL, '', '', '', NULL, '2023-10-18 07:59:16', '2023-10-18 07:59:16', 1, ''),
(51, 'Testing', 'Resend', 'o@gmail.com', '+92', '67679784848', '$2b$10$h3aO71zIVkyetjr2ECatOOt7iQmS0qYZZu0p8Dq5luKEU1VDm6UNm', '', 1, '2023-10-18 10:39:16', 'cus_OqDaRuT3fGgDgT', '', 'Public/Profile/profile-51-1697625605680.jpg', NULL, '2023-10-18 08:01:11', '2023-10-18 10:40:12', 1, ''),
(55, 'sigi', 'dec', 'sigidevelopers@gmail.com', '+507', '68688.66898', '$2b$10$VczZl4RfT9Udd4hJ0ik7d.GW5.4Z0PAP3wZvEeCGR0mvxld6T3gNy', '', 1, '2023-10-19 10:42:22', 'cus_Oqasq3xJ1vk5qT', '', 'Public/Profile/profile-55-1697712198408.jpg', NULL, '2023-10-19 10:42:22', '2023-10-26 11:59:43', 1, 'google'),
(56, 'wajeeh', 'ulhassan', 'wajeeh.ch1@gmail.com', '+507', '5649798895', '$2b$10$qj31oxggsu5poit1hql0Ge2Wevl36xbspqNHHWjlPl5rcfgMiJ5JC', '', 1, '2023-10-25 04:36:58', 'cus_OskKZa342UgI27', '', 'Public/Profile/profile-56-1698208705741.jpg', NULL, '2023-10-19 10:48:11', '2023-10-25 06:49:50', 1, 'google'),
(58, 'arbab', 'dev', 'arb@gmail.com', '+507', '56656868686', '$2b$10$Y1bz.jC8E/x.kBe5C0Lfoez4btMmfikriYcr6QWoRzFq/HXemayRO', '', 1, '2023-10-20 10:42:16', 'cus_OqcgLpK7xGl0aJ', '', 'Public/Profile/profile-58-1697798558089.jpg', NULL, '2023-10-20 10:42:10', '2023-10-20 10:42:49', 1, ''),
(59, 'danish', 'ali', 'danishh@gmail.com', '+507', '4649949494', '$2b$10$qAGF34D4xO6xxVpJLZ5kju3h6vumyuqtcy5aK6IfnBisE6U29NMQK', '', 1, '2023-10-24 09:10:23', '', '', 'Public/Profile/profile-1698138615543.jpg', NULL, '2023-10-24 09:10:16', '2023-10-24 09:10:23', 2, ''),
(60, 'zeeshan', 'nawaz', 'zeeshannawaz313@gmail.com', '+507', '45545451242', '$2b$10$rbADOmjMv4yF.Q/DVGHIJelzE7/RTRf5HfK6LXPIPpbO8UkZBSirG', '', 1, '2023-10-24 09:20:21', 'cus_OsRgKetkD2D8zy', '', 'Public/Profile/profile-60-1698139239065.jpg', NULL, '2023-10-24 09:20:09', '2023-10-24 10:18:28', 1, ''),
(62, 'zeeshan', 'nawaz', 'zeeshannawaz393@gmail.com', '+1', '84616134335', '$2b$10$XVP8lbpw8X6qm3O04hEQ4OnQK03cro4yu5STFA8cB7Xa5gVIFQi2a', '', 1, '2023-10-27 05:43:09', 'cus_OtVqtedw7hN0gM', '', 'Public/Profile/profile-62-1698385419619.jpg', NULL, '2023-10-26 07:22:03', '2023-10-27 05:43:45', 1, ''),
(63, 'shah', 'nawaz', 'shahnawazdesign99@gmail.com', '+507', '64646464646', '', '', 1, '2023-10-26 10:00:27', 'cus_OtCmagr8ZRqlmw', '', 'Public/Profile/profile-63-1698314464123.jpg', NULL, '2023-10-26 10:00:27', '2023-10-26 10:01:06', 1, 'google'),
(64, 'asd', 'fgh', 'dd@gmail.com', '+1', '55544646466', '$2b$10$bRbGymw5S5J800bmIh3.9O948.J8D9FGDFW0LOFpIdrqNq0ZXFZAu', '', 1, '2023-10-26 10:12:27', 'cus_OtCyfA4AopKQdT', '', 'Public/Profile/profile-64-1698315955325.jpg', NULL, '2023-10-26 10:11:54', '2023-10-26 10:25:57', 1, ''),
(65, 'kiran', 'ulhassan', 'kiran@sigi.com', '+1', '56468644606', '$2b$10$w86svVtzeFFI0oVAFlJ8eekcArlLIPBssRkJ7PddXLXvSL/81f5.q', '', 1, '2023-10-26 11:48:23', 'cus_OtEWDzk0L5oHMk', '', 'Public/Profile/profile-65-1698328682724.jpg', NULL, '2023-10-26 11:48:12', '2023-10-26 13:58:06', 1, ''),
(66, 'dan', 'ish', 'da@gmail.com', '+1', '56868686685', '$2b$10$Iq4hbZGdxzrM7vjFnyVqQOHJO5JL0FUwCx3yBJojnE3QGCiu93wfe', '', 1, '2023-10-26 11:51:41', 'cus_OtEZLHfHmtC1r4', '', 'Public/Profile/profile-66-1698321128416.jpg', NULL, '2023-10-26 11:51:32', '2023-10-26 11:52:09', 1, ''),
(67, 'a', 'b', 'asdf@gmail.com', '+507', '68686751818', '$2b$10$0r89wbmLqOunge4tNRI9DOFCs5vzKEr02YLL/Ntqc/ZpHgpZR54fe', '', 1, '2023-10-26 11:57:40', 'cus_OtEfoOBuNQ597X', '', 'Public/Profile/profile-67-1698321484009.jpg', NULL, '2023-10-26 11:57:36', '2023-10-26 11:58:06', 1, ''),
(68, 'test', '57', 'test57@gmail.com', '+1', '94946464646', '$2b$10$zCoPUTmknUlgquVFMoq9U.7OnSHTVYUosZ2.fdPVF4.zl2H9cNTo2', '', 1, '2023-10-26 13:21:43', 'cus_OtG1eWbnfrGnk7', '', 'Public/Profile/profile-68-1698326531722.jpg', NULL, '2023-10-26 13:21:30', '2023-10-26 13:22:12', 1, ''),
(69, 'kiran', 'testing', 'kiran11@gmail.com', '+507', '61818164646', '$2b$10$nLLap1wggf27ijo80huMouMAfrSdJkPhm7H983Wn3DJORC.nilGN.', '', 1, '2023-10-26 13:21:35', 'cus_OtG15GH1kacbFw', '', 'Public/Profile/profile-69-1698326532342.jpg', NULL, '2023-10-26 13:21:31', '2023-10-26 13:22:15', 1, ''),
(70, 'hj', 'kl', 'hj@gmail.com', '+1', '65868668866', '$2b$10$XqTUjXYAdQuW/ThsKSGV3OjzkksC5eSYqce7XJRYHQufpgJkjxcKO', '', 1, '2023-10-26 13:32:50', 'cus_OtGCszolGJv1ki', '', 'Public/Profile/profile-70-1698327195220.jpg', NULL, '2023-10-26 13:32:42', '2023-10-26 13:33:15', 1, ''),
(71, 'Test', 'Driver2', 'testdriver@gmail.com', '+507', '9007860122', '$2b$10$6BRygDB.TolOCaEx9y8VFeDFkoYlZstxgjjs4owPuBUbi.5lW0gta', '', 1, '2023-10-27 00:00:00', '', '', 'Public/Profile/profile-1698403222781.jpg', NULL, '2023-10-27 10:40:23', '2023-10-27 10:41:21', 2, ''),
(72, 'mmm', 'kkkk', 'mk@gmail.com', '+1', '86868657575', '$2b$10$7Yx7.ts5zH1cl3bCIBfaY.jlsGDGKfHni5QsyGYb.3vM/N42rj5Ui', '', 1, '2023-10-27 10:45:24', 'cus_Otaj0uFDbhUMnZ', '', 'Public/Profile/profile-72-1698403549299.jpg', NULL, '2023-10-27 10:45:17', '2023-10-27 10:45:50', 1, ''),
(73, 'test', '2', 'test2@gmail.com', '+92', '3214567890', '$2b$10$/bvA7a1R7RYdA5.b6cthzu66nLB.pj3kB.r.Hsz7xzvM9SqV0DJye', '', 1, '2023-10-27 10:48:24', '', '', 'Public/Profile/profile-1698403518620.jpg', NULL, '2023-10-27 10:45:21', '2023-10-27 10:48:24', 2, ''),
(74, 'gg', 'gh', 'kk@gmail.com', '+1', '85855775757', '$2b$10$aQjbWMt9/N/TSzCgQPA1vOZfahKhtMRY7uDxaAY46.Ap8ROGrAZ.e', '', 1, '2023-10-27 11:04:31', 'cus_Otb2lsgIH0HDHq', '', 'Public/Profile/profile-74-1698404693345.jpg', NULL, '2023-10-27 11:04:23', '2023-10-27 11:04:53', 1, ''),
(75, 'Asad', 'Ali', 'li@gmail.com', '+92', '74745464445', '$2b$10$tdWH.W0MBH8rdfJS4eQbyeZ82ELJYN8MaqIeN/AnECB7I.dcFww2u', '', 1, '2023-10-27 11:20:39', 'cus_OtbIDKrLq9XtYX', '', 'Public/Profile/profile-75-1698406059230.png', NULL, '2023-10-27 11:20:19', '2023-10-27 11:27:40', 1, ''),
(76, 'gh', 'ffghfjfvj', 'yy@gmail.com', '+1', '86868685885', '$2b$10$Bd0vxdWzjjjYYn5ZVmav4.a6Wy2iRBFMT1EBWJamuMy0BuhCf9/aa', '', 1, '2023-10-27 11:32:03', 'cus_OtbTnoyGEiez76', '', 'Public/Profile/profile-76-1698406369428.jpg', NULL, '2023-10-27 11:31:53', '2023-10-27 11:32:52', 1, ''),
(77, 'iqra', 'nawaz', 'iqra@gmail.com', '+92', '3525478885', '$2b$10$L6mxr62CbOMj2sVBUhEI/OkuqOOUbdVZUJS.VgTceHJQgYhZFC9DK', '', 1, '2023-10-27 13:04:36', 'cus_OtbTnoyGEiez76', '', 'Public/Profile/profile-1698411870068.jpg', NULL, '2023-10-27 13:04:30', '2023-10-27 13:04:36', 2, ''),
(78, '', '', 'yyy@gmail.com', NULL, '', '$2b$10$9judjYmptHqsipYywSHQwuoksk9ruUZoKD42qPspKzq.44t2XEnVm', '', 1, '2023-10-27 13:24:27', 'cus_OtdIhAxlYsYGyk', '', '', NULL, '2023-10-27 13:24:20', '2023-10-27 13:24:27', 1, ''),
(79, '', '', 'hh@gmail.com', NULL, '', '$2b$10$hT6Y4u/X2Rqu3kZ7V1Hhf.45RcsT2SF9IaMIhLsjXS4aTIaCmtmRC', '', 1, '2023-10-27 13:51:20', 'cus_OtdjN9gYfOhgFj', '', '', NULL, '2023-10-27 13:51:15', '2023-10-27 13:51:20', 1, ''),
(80, '', '', 'danijsh@gmail.com', NULL, '', '$2b$10$WZb/U67/tXR4TSiYMeLTd.favod2JDdXVg9JeTdFqS4Yq.lfPoC.i', '', 1, '2023-10-27 14:43:04', 'cus_OteYTuYvp6gLib', '', '', NULL, '2023-10-27 14:42:56', '2023-10-27 14:43:04', 1, ''),
(81, 'jorge', 'blanco', 'Imexport.jb@gmail.com', '+1', '7874854624', '$2b$10$VBg5Lg8dwzvt7yuKEDIyDO0ZRfMI4Bi8w7FIAd9Hj9ElRe3prGHIK', '', 1, '2023-10-30 14:00:16', 'cus_OulX7hE2LCCxEH', '', 'Public/Profile/profile-81-1698674465068.jpg', NULL, '2023-10-30 12:30:24', '2023-11-01 02:58:11', 1, ''),
(82, 'Muhammad', 'Ali', 'ali26@gmal.com', '+92', '09990999', '$2b$10$u7iz783w6HkMGVpxZij9TuTp5E9E6a3B6yNHkzfsw5Xt9CrBUMTYG', '', 1, '2023-10-30 19:00:00', '', '', 'Public/Images/Profile/profile-1698730569611.webp', NULL, '2023-10-31 05:36:09', '2023-10-31 05:38:00', 2, '');

-- --------------------------------------------------------

--
-- Table structure for table `userTypes`
--

CREATE TABLE `userTypes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `userTypes`
--

INSERT INTO `userTypes` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'Customer', '2022-07-04 17:21:11', '2022-07-04 17:21:11'),
(2, 'Driver', '2022-07-04 17:21:11', '2022-07-04 17:21:11');

-- --------------------------------------------------------

--
-- Table structure for table `vehicleImages`
--

CREATE TABLE `vehicleImages` (
  `id` int(11) NOT NULL,
  `image` varchar(255) DEFAULT '',
  `uploadTime` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `driverDetailId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `vehicleImages`
--

INSERT INTO `vehicleImages` (`id`, `image`, `uploadTime`, `status`, `createdAt`, `updatedAt`, `driverDetailId`, `userId`) VALUES
(1, 'Public/Images/VehicleImages/VehImg-undefined-1696398394437.jpg', '2023-10-04 05:46:35', 0, '2023-10-04 05:46:35', '2023-10-05 12:52:31', NULL, 5),
(2, 'Public/Images/VehicleImages/VehImg-undefined-1696398394679.jpg', '2023-10-04 05:46:35', 0, '2023-10-04 05:46:35', '2023-10-05 12:52:31', NULL, 5),
(3, 'Public/Images/VehicleImages/VehImg-undefined-1696398395073.jpg', '2023-10-04 05:46:35', 0, '2023-10-04 05:46:35', '2023-10-05 12:52:31', NULL, 5),
(4, 'Public/Images/VehicleImages/VehImg-undefined-1696510350995.jpg', '2023-10-05 12:52:32', 1, '2023-10-05 12:52:31', '2023-10-05 12:52:31', NULL, 5),
(5, 'Public/Images/VehicleImages/VehImg-undefined-1696510351346.jpg', '2023-10-05 12:52:32', 1, '2023-10-05 12:52:31', '2023-10-05 12:52:31', NULL, 5),
(6, 'Public/Images/VehicleImages/VehImg-undefined-1696510351701.jpg', '2023-10-05 12:52:32', 1, '2023-10-05 12:52:31', '2023-10-05 12:52:31', NULL, 5),
(7, 'Public/Images/VehicleImages/VehImg-7-1696572413003.jpg', '2023-10-06 06:06:54', 1, '2023-10-06 06:06:54', '2023-10-06 06:06:54', NULL, 7),
(8, 'Public/Images/VehicleImages/VehImg-2-1696574876361.jpg', '2023-10-06 06:47:58', 1, '2023-10-06 06:47:58', '2023-10-06 06:47:58', NULL, 2),
(9, 'Public/Images/VehicleImages/VehImg-19-1697105964059.jpg', '2023-10-11 19:00:00', 1, '2023-10-12 10:19:24', '2023-10-12 10:19:24', NULL, 19),
(10, 'Public/Images/VehicleImages/VehImg-23-1697115946883.PNG', '2023-10-11 19:00:00', 1, '2023-10-12 13:05:47', '2023-10-12 13:05:47', NULL, 23),
(11, 'Public/Images/VehicleImages/VehImg-23-1697115946883.PNG', '2023-10-11 19:00:00', 1, '2023-10-12 13:05:47', '2023-10-12 13:05:47', NULL, 23),
(12, 'Public/Images/VehicleImages/VehImg-23-1697115947188.png', '2023-10-11 19:00:00', 1, '2023-10-12 13:05:47', '2023-10-12 13:05:47', NULL, 23),
(13, 'Public/Images/VehicleImages/VehImg-23-1697115947496.png', '2023-10-11 19:00:00', 1, '2023-10-12 13:05:47', '2023-10-12 13:05:47', NULL, 23),
(14, 'Public/Images/VehicleImages/VehImg-24-1697175010074.jpg', '2023-10-12 19:00:00', 1, '2023-10-13 05:30:12', '2023-10-13 05:30:12', NULL, NULL),
(15, 'Public/Images/VehicleImages/VehImg-25-1697175984059.jpg', '2023-10-12 19:00:00', 1, '2023-10-13 05:46:24', '2023-10-13 05:46:24', NULL, NULL),
(16, 'Public/Images/VehicleImages/VehImg-27-1697176954535.png', '2023-10-12 19:00:00', 1, '2023-10-13 06:02:35', '2023-10-13 06:02:35', NULL, 27),
(17, 'Public/Images/VehicleImages/VehImg-28-1697198004187.png', '2023-10-13 11:53:31', 1, '2023-10-13 11:53:31', '2023-10-13 11:53:31', NULL, 28),
(18, 'Public/VehicleImages/VehImg-31-1697447061371.png', '2023-10-16 09:04:21', 0, '2023-10-16 09:04:21', '2023-10-24 09:48:38', NULL, 31),
(19, 'Public/VehicleImages/VehImg-31-1697447061371.png', '2023-10-16 09:04:21', 0, '2023-10-16 09:04:21', '2023-10-24 09:48:38', NULL, 31),
(20, 'Public/VehicleImages/VehImg-31-1697447061371.png', '2023-10-16 09:04:21', 0, '2023-10-16 09:04:21', '2023-10-24 09:48:38', NULL, 31),
(21, 'Public/VehicleImages/VehImg-31-1697447061372.png', '2023-10-16 09:04:21', 0, '2023-10-16 09:04:21', '2023-10-24 09:48:38', NULL, 31),
(22, 'Public/Images/VehicleImages/VehImg-1-1697522049044.png', '2023-10-17 05:54:09', 1, '2023-10-17 05:54:09', '2023-10-17 05:54:09', NULL, 1),
(23, 'Public/VehicleImages/VehImg-45-1697538522342.jpg', '2023-10-17 10:28:44', 1, '2023-10-17 10:28:44', '2023-10-17 10:28:44', NULL, 45),
(24, 'Public/VehicleImages/VehImg-45-1697538523345.jpg', '2023-10-17 10:28:44', 1, '2023-10-17 10:28:44', '2023-10-17 10:28:44', NULL, 45),
(25, 'Public/VehicleImages/VehImg-45-1697538523660.jpg', '2023-10-17 10:28:44', 1, '2023-10-17 10:28:44', '2023-10-17 10:28:44', NULL, 45),
(26, 'Public/VehicleImages/VehImg-45-1697538523975.jpg', '2023-10-17 10:28:44', 1, '2023-10-17 10:28:44', '2023-10-17 10:28:44', NULL, 45),
(27, 'Public/Images/VehicleImages/VehImg-71-1698403239527.jpg', '2023-10-27 10:40:40', 1, '2023-10-27 10:40:40', '2023-10-27 10:40:40', NULL, 71),
(28, 'Public/VehicleImages/VehImg-73-1698403830065.jpg', '2023-10-27 10:50:31', 1, '2023-10-27 10:50:31', '2023-10-27 10:50:31', NULL, 73),
(29, 'Public/VehicleImages/VehImg-73-1698403831018.jpg', '2023-10-27 10:50:31', 1, '2023-10-27 10:50:31', '2023-10-27 10:50:31', NULL, 73),
(30, 'Public/VehicleImages/VehImg-73-1698403831347.jpg', '2023-10-27 10:50:31', 1, '2023-10-27 10:50:31', '2023-10-27 10:50:31', NULL, 73),
(31, 'Public/VehicleImages/VehImg-73-1698403831358.jpg', '2023-10-27 10:50:31', 1, '2023-10-27 10:50:31', '2023-10-27 10:50:31', NULL, 73),
(32, 'Public/Images/VehicleImages/VehImg-4-1698405700681.jpg', '2023-10-27 11:21:41', 1, '2023-10-27 11:21:41', '2023-10-27 11:21:41', NULL, 4),
(33, 'Public/VehicleImages/VehImg-77-1698411954460.jpg', '2023-10-27 13:05:57', 1, '2023-10-27 13:05:57', '2023-10-27 13:05:57', NULL, 77),
(34, 'Public/VehicleImages/VehImg-77-1698411955688.jpg', '2023-10-27 13:05:57', 1, '2023-10-27 13:05:57', '2023-10-27 13:05:57', NULL, 77),
(35, 'Public/VehicleImages/VehImg-77-1698411956035.jpg', '2023-10-27 13:05:57', 1, '2023-10-27 13:05:57', '2023-10-27 13:05:57', NULL, 77),
(36, 'Public/VehicleImages/VehImg-77-1698411956713.jpg', '2023-10-27 13:05:57', 1, '2023-10-27 13:05:57', '2023-10-27 13:05:57', NULL, 77),
(37, 'Public/Images/VehicleImages/VehImg-82-1698730633614.jpg', '2023-10-30 19:00:00', 1, '2023-10-31 05:37:14', '2023-10-31 05:37:14', NULL, 82);

-- --------------------------------------------------------

--
-- Table structure for table `vehicleMakes`
--

CREATE TABLE `vehicleMakes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `vehicleModels`
--

CREATE TABLE `vehicleModels` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `deleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `vehicleMakeId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `vehicleTypes`
--

CREATE TABLE `vehicleTypes` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT '',
  `image` varchar(255) DEFAULT '',
  `status` tinyint(1) DEFAULT '0',
  `baseRate` float(8,2) DEFAULT '0.00',
  `perUnitRate` float(8,2) DEFAULT '0.00',
  `perRideCharge` float(8,2) DEFAULT '0.00',
  `weightCapacity` float(8,2) DEFAULT '0.00',
  `volumeCapacity` float(8,2) DEFAULT '0.00',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `appUnitId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `vehicleTypes`
--

INSERT INTO `vehicleTypes` (`id`, `title`, `image`, `status`, `baseRate`, `perUnitRate`, `perRideCharge`, `weightCapacity`, `volumeCapacity`, `createdAt`, `updatedAt`, `appUnitId`) VALUES
(1, 'xyz', 'Public/Images/VehicleTypes/vehicleImage-xyz-1696248794084.png', 1, 32.00, 64.00, 0.00, 323.00, 2212.00, '2023-10-02 12:13:14', '2023-10-31 11:03:39', NULL),
(2, 'Vehicle 1', 'Public/Images/VehicleTypes/vehicleImage-Vehicle 1-1696248940123.jpg', 1, 16.00, 16.00, 0.00, 800.00, 240.00, '2023-10-02 12:15:48', '2023-10-04 09:58:59', NULL),
(3, 'Vehicle 21', 'Public/Images/VehicleTypes/vehicleImage-Vehicle 21-1697442127683.png', 0, 401.00, 321.00, 0.00, 10010.00, 11500.00, '2023-10-04 09:55:08', '2023-10-17 09:06:44', NULL),
(4, 'a', 'Public/Images/VehicleTypes/vehicleImage-a-1697442079910.png', 0, 1.00, 1.00, 0.00, 1.00, 1.00, '2023-10-16 07:41:21', '2023-10-17 07:58:08', NULL),
(5, 'a', 'Public/Images/VehicleTypes/vehicleImage-a-1697448006106.png', 0, 1.00, 1.00, 0.00, 1.00, 1.00, '2023-10-16 09:20:06', '2023-10-17 07:59:21', NULL),
(6, 'a', 'Public/Images/VehicleTypes/vehicleImage-a-1697540280559.jpg', 0, 1.00, 1.00, 0.00, 1.00, 1.00, '2023-10-17 10:58:05', '2023-10-17 10:58:10', NULL),
(7, 'Test Vehicle', 'Public/Images/VehicleTypes/vehicleImage-Test Vehicle-1698750258872.jpg', 1, 50.00, 60.00, 0.00, 1000.00, 1500.00, '2023-10-31 10:44:17', '2023-10-31 11:04:20', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `volumetricWeightCharges`
--

CREATE TABLE `volumetricWeightCharges` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `startValue` float DEFAULT NULL,
  `endValue` float DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `volumetricWeightCharges`
--

INSERT INTO `volumetricWeightCharges` (`id`, `title`, `startValue`, `endValue`, `price`, `unit`, `createdAt`, `updatedAt`) VALUES
(1, 'R1', 0, 400, 3.33, 'cm3', '2023-01-03 14:54:15', '2023-04-04 10:08:58'),
(2, 'R2', 401, 1000, 9.66, 'cm3', '2023-03-09 10:11:22', '2023-03-10 12:12:26'),
(3, 'R3', 1001, 5000, 30.00, 'cm3', '2023-03-09 10:44:31', '2023-03-09 10:44:31');

-- --------------------------------------------------------

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `id` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `currency` varchar(255) DEFAULT '$',
  `description` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `bookingId` int(11) DEFAULT NULL,
  `driverPaymentSystemId` int(11) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `adminId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `wallets`
--

INSERT INTO `wallets` (`id`, `amount`, `currency`, `description`, `createdAt`, `updatedAt`, `bookingId`, `driverPaymentSystemId`, `userId`, `adminId`) VALUES
(1, -32.00, '$', 'Delivery Driver Earnings', '2023-10-20 11:26:59', '2023-10-20 11:26:59', NULL, 1, 31, NULL),
(2, 32.00, '$', 'Admin Earning', '2023-10-20 11:26:59', '2023-10-20 11:26:59', NULL, NULL, NULL, 1),
(3, -32.00, '$', 'Delivery Driver Earnings', '2023-10-20 11:39:36', '2023-10-20 11:39:36', NULL, 1, 31, NULL),
(4, 32.00, '$', 'Admin Earning', '2023-10-20 11:39:36', '2023-10-20 11:39:36', NULL, NULL, NULL, 1),
(5, -16.00, '$', 'Delivery Driver Earnings', '2023-10-20 15:56:24', '2023-10-20 15:56:24', NULL, 1, NULL, NULL),
(6, 16.00, '$', 'Admin Earning', '2023-10-20 15:56:24', '2023-10-20 15:56:24', NULL, NULL, NULL, 1),
(7, -16.00, '$', 'Delivery Driver Earnings', '2023-10-20 16:01:40', '2023-10-20 16:01:40', NULL, 1, NULL, NULL),
(8, 16.00, '$', 'Admin Earning', '2023-10-20 16:01:40', '2023-10-20 16:01:40', NULL, NULL, NULL, 1),
(9, -16.00, '$', 'Delivery Driver Earnings', '2023-10-20 16:06:02', '2023-10-20 16:06:02', NULL, 1, NULL, NULL),
(10, 16.00, '$', 'Admin Earning', '2023-10-20 16:06:02', '2023-10-20 16:06:02', NULL, NULL, NULL, 1),
(11, -16.00, '$', 'Delivery Driver Earnings', '2023-10-26 07:47:30', '2023-10-26 07:47:30', NULL, 1, NULL, NULL),
(12, 16.00, '$', 'Admin Earning', '2023-10-26 07:47:30', '2023-10-26 07:47:30', NULL, NULL, NULL, 1),
(13, -32.00, '$', 'Delivery Driver Earnings', '2023-10-26 09:13:10', '2023-10-26 09:13:10', NULL, 1, 45, NULL),
(14, 32.00, '$', 'Admin Earning', '2023-10-26 09:13:10', '2023-10-26 09:13:10', NULL, NULL, NULL, 1),
(15, -32.00, '$', 'Delivery Driver Earnings', '2023-10-26 09:14:29', '2023-10-26 09:14:29', NULL, 1, 45, NULL),
(16, 32.00, '$', 'Admin Earning', '2023-10-26 09:14:29', '2023-10-26 09:14:29', NULL, NULL, NULL, 1),
(17, -32.00, '$', 'Delivery Driver Earnings', '2023-10-26 09:16:01', '2023-10-26 09:16:01', NULL, 1, 45, NULL),
(18, 32.00, '$', 'Admin Earning', '2023-10-26 09:16:01', '2023-10-26 09:16:01', NULL, NULL, NULL, 1),
(19, -32.00, '$', 'Delivery Driver Earnings', '2023-10-26 09:16:30', '2023-10-26 09:16:30', NULL, 1, 45, NULL),
(20, 32.00, '$', 'Admin Earning', '2023-10-26 09:16:30', '2023-10-26 09:16:30', NULL, NULL, NULL, 1),
(21, -32.00, '$', 'Delivery Driver Earnings', '2023-10-26 09:49:58', '2023-10-26 09:49:58', NULL, 1, 45, NULL),
(22, 32.00, '$', 'Admin Earning', '2023-10-26 09:49:58', '2023-10-26 09:49:58', NULL, NULL, NULL, 1),
(23, -16.00, '$', 'Delivery Driver Earnings', '2023-10-26 09:50:12', '2023-10-26 09:50:12', NULL, 1, NULL, NULL),
(24, 16.00, '$', 'Admin Earning', '2023-10-26 09:50:12', '2023-10-26 09:50:12', NULL, NULL, NULL, 1),
(25, -32.00, '$', 'Delivery Driver Earnings', '2023-10-26 09:54:38', '2023-10-26 09:54:38', NULL, 1, 45, NULL),
(26, 32.00, '$', 'Admin Earning', '2023-10-26 09:54:38', '2023-10-26 09:54:38', NULL, NULL, NULL, 1),
(27, -32.00, '$', 'Delivery Driver Earnings', '2023-10-27 06:16:24', '2023-10-27 06:16:24', NULL, 1, 45, NULL),
(28, 32.00, '$', 'Admin Earning', '2023-10-27 06:16:24', '2023-10-27 06:16:24', NULL, NULL, NULL, 1),
(29, -32.00, '$', 'Delivery Driver Earnings', '2023-10-27 11:12:45', '2023-10-27 11:12:45', NULL, 1, 73, NULL),
(30, 32.00, '$', 'Admin Earning', '2023-10-27 11:12:45', '2023-10-27 11:12:45', NULL, NULL, NULL, 1),
(31, -32.00, '$', 'Delivery Driver Earnings', '2023-10-27 12:52:50', '2023-10-27 12:52:50', NULL, 1, 73, NULL),
(32, 32.00, '$', 'Admin Earning', '2023-10-27 12:52:50', '2023-10-27 12:52:50', NULL, NULL, NULL, 1),
(33, -16.00, '$', 'Delivery Driver Earnings', '2023-10-27 13:23:41', '2023-10-27 13:23:41', NULL, 1, 71, NULL),
(34, 16.00, '$', 'Admin Earning', '2023-10-27 13:23:41', '2023-10-27 13:23:41', NULL, NULL, NULL, 1),
(35, -16.00, '$', 'Delivery Driver Earnings', '2023-10-27 13:37:24', '2023-10-27 13:37:24', NULL, 1, 4, NULL),
(36, 16.00, '$', 'Admin Earning', '2023-10-27 13:37:24', '2023-10-27 13:37:24', NULL, NULL, NULL, 1),
(37, -16.00, '$', 'Delivery Driver Earnings', '2023-10-27 13:56:49', '2023-10-27 13:56:49', NULL, 1, 4, NULL),
(38, 16.00, '$', 'Admin Earning', '2023-10-27 13:56:49', '2023-10-27 13:56:49', NULL, NULL, NULL, 1),
(39, -16.00, '$', 'Delivery Driver Earnings', '2023-10-30 06:40:03', '2023-10-30 06:40:03', NULL, 1, 71, NULL),
(40, 16.00, '$', 'Admin Earning', '2023-10-30 06:40:03', '2023-10-30 06:40:03', NULL, NULL, NULL, 1),
(41, -16.00, '$', 'Delivery Driver Earnings', '2023-10-30 09:51:56', '2023-10-30 09:51:56', NULL, 1, 71, NULL),
(42, 16.00, '$', 'Admin Earning', '2023-10-30 09:51:56', '2023-10-30 09:51:56', NULL, NULL, NULL, 1),
(43, -16.00, '$', 'Delivery Driver Earnings', '2023-10-30 12:27:32', '2023-10-30 12:27:32', NULL, 1, 71, NULL),
(44, 16.00, '$', 'Admin Earning', '2023-10-30 12:27:32', '2023-10-30 12:27:32', NULL, NULL, NULL, 1),
(45, -16.00, '$', 'Delivery Driver Earnings', '2023-10-31 07:21:05', '2023-10-31 07:21:05', NULL, 1, 71, NULL),
(46, 16.00, '$', 'Admin Earning', '2023-10-31 07:21:05', '2023-10-31 07:21:05', NULL, NULL, NULL, 1),
(47, -16.00, '$', 'Delivery Driver Earnings', '2023-10-31 07:22:23', '2023-10-31 07:22:23', NULL, 1, 71, NULL),
(48, 16.00, '$', 'Admin Earning', '2023-10-31 07:22:23', '2023-10-31 07:22:23', NULL, NULL, NULL, 1),
(49, -16.00, '$', 'Delivery Driver Earnings', '2023-10-31 08:00:32', '2023-10-31 08:00:32', NULL, 1, 71, NULL),
(50, 16.00, '$', 'Admin Earning', '2023-10-31 08:00:32', '2023-10-31 08:00:32', NULL, NULL, NULL, 1),
(51, -16.00, '$', 'Delivery Driver Earnings', '2023-10-31 08:01:09', '2023-10-31 08:01:09', NULL, 1, 71, NULL),
(52, 16.00, '$', 'Admin Earning', '2023-10-31 08:01:09', '2023-10-31 08:01:09', NULL, NULL, NULL, 1),
(53, -16.00, '$', 'Delivery Driver Earnings', '2023-10-31 08:01:16', '2023-10-31 08:01:16', NULL, 1, 71, NULL),
(54, 16.00, '$', 'Admin Earning', '2023-10-31 08:01:16', '2023-10-31 08:01:16', NULL, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `companyName` varchar(255) DEFAULT NULL,
  `companyEmail` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0',
  `dvToken` varchar(255) DEFAULT NULL,
  `countryCode` varchar(16) DEFAULT '',
  `phoneNum` varchar(72) DEFAULT '',
  `located` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `addressDBId` int(11) DEFAULT NULL,
  `classifiedAId` int(11) DEFAULT NULL,
  `roleId` int(11) DEFAULT NULL,
  `employeeOf` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `email`, `password`, `companyName`, `companyEmail`, `status`, `dvToken`, `countryCode`, `phoneNum`, `located`, `createdAt`, `updatedAt`, `addressDBId`, `classifiedAId`, `roleId`, `employeeOf`) VALUES
(1, 'admin@shippinghack.com', '$2b$10$dq1.OiwGQaGiO7.SQ1RcoOC2ZnRW9v48s2oSRuXFGIcoQxsTmRByq', 'Super Admin', NULL, 1, '2179be7w9sk19', ' +92', '1234567 ', NULL, '2023-01-30 11:41:46', '2023-10-31 10:23:20', NULL, 1, NULL, NULL),
(2, 'usa@gmail.com', '$2b$10$g6QAKL1kU2JmDU20iLnB1uAzpd2xhWBw3cAK2PazT3D5NaKBgeLG6', 'Warehouse USA', 'usa@gmail.com', 1, 'saasas4', '+507', '12165452', 'usa', '2023-09-26 05:45:33', '2023-10-31 13:31:13', 36, 3, NULL, NULL),
(3, 'rico@gmail.com', '$2b$10$9RGeFkm4xGftRQRfjfojpOOvuwmQb/JsXgZDjPbpi5AnmZt/AN8Ey', 'Warehouse Puerto Rico', NULL, 1, 'saasas4', '+92', '12318413', 'rico', '2023-09-26 05:45:47', '2023-10-31 13:09:15', 42, 3, NULL, NULL),
(4, 'test@gmail.com', '$2b$10$oFKFCT854aPHhQx8H76ukuVF95oLQ16MhvdEd2vVfCNsnK6Ijz2TS', 'Warehouse Test', NULL, 1, NULL, '+507', '90078601', 'usa', '2023-10-04 09:07:20', '2023-10-19 06:35:01', 1, 3, NULL, NULL),
(5, 'sigi@gmail.com', '$2b$10$zoMhjwziGAw/S2x4crmkjuz2gJbM.KNMQphYcmBVe/bEYNmm/zMaG', 'Sigi', NULL, 1, NULL, '+92', '34567123', 'usa', '2023-10-12 12:36:34', '2023-10-31 11:33:20', NULL, 2, 1, NULL),
(6, 'mali@gmail.com', '$2b$10$OBW/xFO/2EVQmTVow6EOaOT0U4EmSD0OZpTfBlWhvo6uFs5HvRrTS', 'M Ali', NULL, 1, NULL, '+92', '9007860122', 'usa', '2023-10-13 07:05:41', '2023-10-13 07:50:40', NULL, 2, 2, 1),
(7, 'tahoor@gmail.com', '$2b$10$pQ9q276SnTcA8I0hTdlb3eplJgZG5JUKXQrw85ZzTlqqhmEHivjlW', 'Tahoor Ahmad', NULL, 1, NULL, '+92', '3112222111', 'usa', '2023-10-13 07:51:08', '2023-10-13 08:00:08', 38, 2, 1, 1),
(8, 'a@gmail.com', '$2b$10$jY2YkQxEG8YjZqADFUudXuv/55T2fNIDcw8ZKt00/GINHKP0iB/wO', '', NULL, 0, NULL, '507', '111', 'usa', '2023-10-13 12:07:08', '2023-10-16 07:01:21', NULL, 3, NULL, NULL),
(9, 'a@k.com', '$2b$10$SY1hgBttQ1vmGs8Do4KeJOTtrrvxN6jEf3QU1zt6rN5n62954IJDm', '', NULL, 0, NULL, '507', '1', 'usa', '2023-10-13 12:10:32', '2023-10-13 12:11:00', NULL, 3, NULL, NULL),
(10, 'admin@pps.com', '$2b$10$drqELaL5YhAyyYDU9HYtjealrIpK.Z5ojeBL3SgxINe97hGj5Sdm.', 'a', NULL, 0, NULL, '507', '1', 'usa', '2023-10-17 06:02:10', '2023-10-17 06:02:25', 65, 3, NULL, NULL),
(12, 'sigi1@gmail.com', '$2b$10$XmaKAJ0QDDxydC051737C.gahIdxSDQFFA6Cu2NRETVB7RSBYd8mW', 'a', NULL, 0, NULL, '507', '11111', 'usa', '2023-10-17 06:11:55', '2023-10-17 06:18:36', 67, 3, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `webPolicies`
--

CREATE TABLE `webPolicies` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `value` text,
  `status` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `webPolicies`
--

INSERT INTO `webPolicies` (`id`, `title`, `value`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Privacy Policy', 'Privacy Policy of The Shipping Hack.', NULL, '2023-10-11 07:10:13', '2023-10-19 06:32:33'),
(2, 'Terms & Conditions', 'Terms & Conditions of The Shipping Hack.', NULL, '2023-10-11 07:10:41', '2023-10-19 06:32:47');

-- --------------------------------------------------------

--
-- Table structure for table `weightCharges`
--

CREATE TABLE `weightCharges` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `startValue` float DEFAULT NULL,
  `endValue` float DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `weightCharges`
--

INSERT INTO `weightCharges` (`id`, `title`, `startValue`, `endValue`, `price`, `unit`, `createdAt`, `updatedAt`) VALUES
(1, 'Range 1', 0, 1, 0.25, 'kg', '2023-01-03 14:54:56', '2023-01-03 14:54:56'),
(2, 'Range 2', 1, 10, 6.25, 'kg', '2023-03-09 10:10:44', '2023-03-09 10:10:44'),
(3, 'Range 3', 0, 1100, 118.50, 'kg', '2023-03-09 10:44:02', '2023-10-16 09:18:20');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addressDBs`
--
ALTER TABLE `addressDBs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `structureTypeId` (`structureTypeId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `warehouseId` (`warehouseId`);

--
-- Indexes for table `appUnits`
--
ALTER TABLE `appUnits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `weightUnitId` (`weightUnitId`),
  ADD KEY `lengthUnitId` (`lengthUnitId`),
  ADD KEY `distanceUnitId` (`distanceUnitId`),
  ADD KEY `currencyUnitId` (`currencyUnitId`);

--
-- Indexes for table `banks`
--
ALTER TABLE `banks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `baseUnits`
--
ALTER TABLE `baseUnits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `weightUnitId` (`weightUnitId`),
  ADD KEY `lengthUnitId` (`lengthUnitId`),
  ADD KEY `distanceUnitId` (`distanceUnitId`),
  ADD KEY `currencyUnitId` (`currencyUnitId`);

--
-- Indexes for table `billingDetails`
--
ALTER TABLE `billingDetails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`);

--
-- Indexes for table `bookingHistories`
--
ALTER TABLE `bookingHistories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`),
  ADD KEY `bookingStatusId` (`bookingStatusId`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pickupAddressId` (`pickupAddressId`),
  ADD KEY `dropoffAddressId` (`dropoffAddressId`),
  ADD KEY `appUnitId` (`appUnitId`),
  ADD KEY `bookingStatusId` (`bookingStatusId`),
  ADD KEY `bookingTypeId` (`bookingTypeId`),
  ADD KEY `couponId` (`couponId`),
  ADD KEY `deliveryTypeId` (`deliveryTypeId`),
  ADD KEY `logisticCompanyId` (`logisticCompanyId`),
  ADD KEY `shipmentTypeId` (`shipmentTypeId`),
  ADD KEY `customerId` (`customerId`),
  ADD KEY `receivingDriverId` (`receivingDriverId`),
  ADD KEY `deliveryDriverId` (`deliveryDriverId`),
  ADD KEY `transporterId` (`transporterId`),
  ADD KEY `vehicleTypeId` (`vehicleTypeId`),
  ADD KEY `receivingWarehouseId` (`receivingWarehouseId`),
  ADD KEY `deliveryWarehouseId` (`deliveryWarehouseId`);

--
-- Indexes for table `bookingStatuses`
--
ALTER TABLE `bookingStatuses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bookingTypes`
--
ALTER TABLE `bookingTypes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cancelledBookings`
--
ALTER TABLE `cancelledBookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `reasonId` (`reasonId`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_title_unique` (`title`);

--
-- Indexes for table `classifiedAs`
--
ALTER TABLE `classifiedAs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `deliveryTypes`
--
ALTER TABLE `deliveryTypes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `deviceTokens`
--
ALTER TABLE `deviceTokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `distanceCharges`
--
ALTER TABLE `distanceCharges`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `driverDetails`
--
ALTER TABLE `driverDetails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `driverTypeId` (`driverTypeId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `vehicleTypeId` (`vehicleTypeId`),
  ADD KEY `warehouseId` (`warehouseId`);

--
-- Indexes for table `driverPaymentSystems`
--
ALTER TABLE `driverPaymentSystems`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `driverTypes`
--
ALTER TABLE `driverTypes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ecommerceCompanies`
--
ALTER TABLE `ecommerceCompanies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `FAQs`
--
ALTER TABLE `FAQs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `features`
--
ALTER TABLE `features`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `generalCharges`
--
ALTER TABLE `generalCharges`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inTransitGroups`
--
ALTER TABLE `inTransitGroups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `logisticCompanyId` (`logisticCompanyId`),
  ADD KEY `receivingWarehouseId` (`receivingWarehouseId`),
  ADD KEY `deliveryWarehouseId` (`deliveryWarehouseId`);

--
-- Indexes for table `links`
--
ALTER TABLE `links`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logisticCompanies`
--
ALTER TABLE `logisticCompanies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logisticCompanyCharges`
--
ALTER TABLE `logisticCompanyCharges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `logisticCompanyId` (`logisticCompanyId`);

--
-- Indexes for table `onGoingOrders`
--
ALTER TABLE `onGoingOrders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `otpVerifications`
--
ALTER TABLE `otpVerifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`),
  ADD KEY `categoryId` (`categoryId`),
  ADD KEY `ecommerceCompanyId` (`ecommerceCompanyId`);

--
-- Indexes for table `paymentRequests`
--
ALTER TABLE `paymentRequests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `featureId` (`featureId`),
  ADD KEY `roleId` (`roleId`);

--
-- Indexes for table `postponedOrders`
--
ALTER TABLE `postponedOrders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`),
  ADD KEY `reasonId` (`reasonId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `pushNotifications`
--
ALTER TABLE `pushNotifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `reasons`
--
ALTER TABLE `reasons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `restrictedItems`
--
ALTER TABLE `restrictedItems`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warehouseId` (`warehouseId`);

--
-- Indexes for table `shipmentTypes`
--
ALTER TABLE `shipmentTypes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `structQuestions`
--
ALTER TABLE `structQuestions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `structureTypeId` (`structureTypeId`);

--
-- Indexes for table `structureTypes`
--
ALTER TABLE `structureTypes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `supports`
--
ALTER TABLE `supports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `userAddresses`
--
ALTER TABLE `userAddresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `addressDBId` (`addressDBId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Email` (`email`),
  ADD UNIQUE KEY `PhoneNumber` (`countryCode`,`phoneNum`),
  ADD KEY `userTypeId` (`userTypeId`);

--
-- Indexes for table `userTypes`
--
ALTER TABLE `userTypes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicleImages`
--
ALTER TABLE `vehicleImages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `driverDetailId` (`driverDetailId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `vehicleMakes`
--
ALTER TABLE `vehicleMakes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vehicleModels`
--
ALTER TABLE `vehicleModels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicleMakeId` (`vehicleMakeId`);

--
-- Indexes for table `vehicleTypes`
--
ALTER TABLE `vehicleTypes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appUnitId` (`appUnitId`);

--
-- Indexes for table `volumetricWeightCharges`
--
ALTER TABLE `volumetricWeightCharges`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bookingId` (`bookingId`),
  ADD KEY `driverPaymentSystemId` (`driverPaymentSystemId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `adminId` (`adminId`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `warehouses_email_unique` (`email`),
  ADD KEY `addressDBId` (`addressDBId`),
  ADD KEY `classifiedAId` (`classifiedAId`),
  ADD KEY `roleId` (`roleId`),
  ADD KEY `employeeOf` (`employeeOf`);

--
-- Indexes for table `webPolicies`
--
ALTER TABLE `webPolicies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `weightCharges`
--
ALTER TABLE `weightCharges`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addressDBs`
--
ALTER TABLE `addressDBs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;

--
-- AUTO_INCREMENT for table `appUnits`
--
ALTER TABLE `appUnits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `banks`
--
ALTER TABLE `banks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `baseUnits`
--
ALTER TABLE `baseUnits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `billingDetails`
--
ALTER TABLE `billingDetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `bookingHistories`
--
ALTER TABLE `bookingHistories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1311;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=294;

--
-- AUTO_INCREMENT for table `bookingStatuses`
--
ALTER TABLE `bookingStatuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `bookingTypes`
--
ALTER TABLE `bookingTypes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `cancelledBookings`
--
ALTER TABLE `cancelledBookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `classifiedAs`
--
ALTER TABLE `classifiedAs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deliveryTypes`
--
ALTER TABLE `deliveryTypes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `deviceTokens`
--
ALTER TABLE `deviceTokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=195;

--
-- AUTO_INCREMENT for table `distanceCharges`
--
ALTER TABLE `distanceCharges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `driverDetails`
--
ALTER TABLE `driverDetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `driverPaymentSystems`
--
ALTER TABLE `driverPaymentSystems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `driverTypes`
--
ALTER TABLE `driverTypes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ecommerceCompanies`
--
ALTER TABLE `ecommerceCompanies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `FAQs`
--
ALTER TABLE `FAQs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `features`
--
ALTER TABLE `features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `generalCharges`
--
ALTER TABLE `generalCharges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inTransitGroups`
--
ALTER TABLE `inTransitGroups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `links`
--
ALTER TABLE `links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `logisticCompanies`
--
ALTER TABLE `logisticCompanies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `logisticCompanyCharges`
--
ALTER TABLE `logisticCompanyCharges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `onGoingOrders`
--
ALTER TABLE `onGoingOrders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `otpVerifications`
--
ALTER TABLE `otpVerifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=485;

--
-- AUTO_INCREMENT for table `paymentRequests`
--
ALTER TABLE `paymentRequests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `postponedOrders`
--
ALTER TABLE `postponedOrders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pushNotifications`
--
ALTER TABLE `pushNotifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reasons`
--
ALTER TABLE `reasons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `restrictedItems`
--
ALTER TABLE `restrictedItems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `shipmentTypes`
--
ALTER TABLE `shipmentTypes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `structQuestions`
--
ALTER TABLE `structQuestions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `structureTypes`
--
ALTER TABLE `structureTypes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supports`
--
ALTER TABLE `supports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `userAddresses`
--
ALTER TABLE `userAddresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `userTypes`
--
ALTER TABLE `userTypes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vehicleImages`
--
ALTER TABLE `vehicleImages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `vehicleMakes`
--
ALTER TABLE `vehicleMakes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicleModels`
--
ALTER TABLE `vehicleModels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicleTypes`
--
ALTER TABLE `vehicleTypes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `volumetricWeightCharges`
--
ALTER TABLE `volumetricWeightCharges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `webPolicies`
--
ALTER TABLE `webPolicies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `weightCharges`
--
ALTER TABLE `weightCharges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addressDBs`
--
ALTER TABLE `addressDBs`
  ADD CONSTRAINT `addressDBs_ibfk_306` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `addressDBs_ibfk_307` FOREIGN KEY (`structureTypeId`) REFERENCES `structureTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `addressDBs_ibfk_308` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `addressDBs_ibfk_309` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `appUnits`
--
ALTER TABLE `appUnits`
  ADD CONSTRAINT `appUnits_ibfk_1` FOREIGN KEY (`weightUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `appUnits_ibfk_2` FOREIGN KEY (`lengthUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `appUnits_ibfk_3` FOREIGN KEY (`distanceUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `appUnits_ibfk_4` FOREIGN KEY (`currencyUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `banks`
--
ALTER TABLE `banks`
  ADD CONSTRAINT `banks_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `baseUnits`
--
ALTER TABLE `baseUnits`
  ADD CONSTRAINT `baseUnits_ibfk_1` FOREIGN KEY (`weightUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `baseUnits_ibfk_2` FOREIGN KEY (`lengthUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `baseUnits_ibfk_3` FOREIGN KEY (`distanceUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `baseUnits_ibfk_4` FOREIGN KEY (`currencyUnitId`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `billingDetails`
--
ALTER TABLE `billingDetails`
  ADD CONSTRAINT `billingDetails_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `bookingHistories`
--
ALTER TABLE `bookingHistories`
  ADD CONSTRAINT `bookingHistories_ibfk_203` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookingHistories_ibfk_204` FOREIGN KEY (`bookingStatusId`) REFERENCES `bookingStatuses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1521` FOREIGN KEY (`pickupAddressId`) REFERENCES `addressDBs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1522` FOREIGN KEY (`dropoffAddressId`) REFERENCES `addressDBs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1523` FOREIGN KEY (`appUnitId`) REFERENCES `appUnits` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1524` FOREIGN KEY (`bookingStatusId`) REFERENCES `bookingStatuses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1525` FOREIGN KEY (`bookingTypeId`) REFERENCES `bookingTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1526` FOREIGN KEY (`couponId`) REFERENCES `coupons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1527` FOREIGN KEY (`deliveryTypeId`) REFERENCES `deliveryTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1528` FOREIGN KEY (`logisticCompanyId`) REFERENCES `logisticCompanies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1529` FOREIGN KEY (`shipmentTypeId`) REFERENCES `shipmentTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1530` FOREIGN KEY (`customerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1531` FOREIGN KEY (`receivingDriverId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1532` FOREIGN KEY (`deliveryDriverId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1533` FOREIGN KEY (`transporterId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1534` FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicleTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1535` FOREIGN KEY (`receivingWarehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_1536` FOREIGN KEY (`deliveryWarehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `cancelledBookings`
--
ALTER TABLE `cancelledBookings`
  ADD CONSTRAINT `cancelledBookings_ibfk_303` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `cancelledBookings_ibfk_304` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `cancelledBookings_ibfk_305` FOREIGN KEY (`reasonId`) REFERENCES `reasons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `deviceTokens`
--
ALTER TABLE `deviceTokens`
  ADD CONSTRAINT `deviceTokens_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `driverDetails`
--
ALTER TABLE `driverDetails`
  ADD CONSTRAINT `driverDetails_ibfk_405` FOREIGN KEY (`driverTypeId`) REFERENCES `driverTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `driverDetails_ibfk_406` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `driverDetails_ibfk_407` FOREIGN KEY (`vehicleTypeId`) REFERENCES `vehicleTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `driverDetails_ibfk_408` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `inTransitGroups`
--
ALTER TABLE `inTransitGroups`
  ADD CONSTRAINT `inTransitGroups_ibfk_304` FOREIGN KEY (`logisticCompanyId`) REFERENCES `logisticCompanies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `inTransitGroups_ibfk_305` FOREIGN KEY (`receivingWarehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `inTransitGroups_ibfk_306` FOREIGN KEY (`deliveryWarehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `logisticCompanyCharges`
--
ALTER TABLE `logisticCompanyCharges`
  ADD CONSTRAINT `logisticCompanyCharges_ibfk_1` FOREIGN KEY (`logisticCompanyId`) REFERENCES `logisticCompanies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `onGoingOrders`
--
ALTER TABLE `onGoingOrders`
  ADD CONSTRAINT `onGoingOrders_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `otpVerifications`
--
ALTER TABLE `otpVerifications`
  ADD CONSTRAINT `otpVerifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `packages`
--
ALTER TABLE `packages`
  ADD CONSTRAINT `packages_ibfk_286` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `packages_ibfk_287` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `packages_ibfk_288` FOREIGN KEY (`ecommerceCompanyId`) REFERENCES `ecommerceCompanies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `paymentRequests`
--
ALTER TABLE `paymentRequests`
  ADD CONSTRAINT `paymentRequests_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_ibfk_203` FOREIGN KEY (`featureId`) REFERENCES `features` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `permissions_ibfk_204` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `postponedOrders`
--
ALTER TABLE `postponedOrders`
  ADD CONSTRAINT `postponedOrders_ibfk_304` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `postponedOrders_ibfk_305` FOREIGN KEY (`reasonId`) REFERENCES `reasons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `postponedOrders_ibfk_306` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_203` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ratings_ibfk_204` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `structQuestions`
--
ALTER TABLE `structQuestions`
  ADD CONSTRAINT `structQuestions_ibfk_1` FOREIGN KEY (`structureTypeId`) REFERENCES `structureTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `userAddresses`
--
ALTER TABLE `userAddresses`
  ADD CONSTRAINT `userAddresses_ibfk_203` FOREIGN KEY (`addressDBId`) REFERENCES `addressDBs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `userAddresses_ibfk_204` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`userTypeId`) REFERENCES `userTypes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vehicleImages`
--
ALTER TABLE `vehicleImages`
  ADD CONSTRAINT `vehicleImages_ibfk_203` FOREIGN KEY (`driverDetailId`) REFERENCES `driverDetails` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `vehicleImages_ibfk_204` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vehicleModels`
--
ALTER TABLE `vehicleModels`
  ADD CONSTRAINT `vehicleModels_ibfk_1` FOREIGN KEY (`vehicleMakeId`) REFERENCES `vehicleMakes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vehicleTypes`
--
ALTER TABLE `vehicleTypes`
  ADD CONSTRAINT `vehicleTypes_ibfk_1` FOREIGN KEY (`appUnitId`) REFERENCES `appUnits` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_405` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `wallets_ibfk_406` FOREIGN KEY (`driverPaymentSystemId`) REFERENCES `driverPaymentSystems` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `wallets_ibfk_407` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `wallets_ibfk_408` FOREIGN KEY (`adminId`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `warehouses_ibfk_405` FOREIGN KEY (`addressDBId`) REFERENCES `addressDBs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouses_ibfk_406` FOREIGN KEY (`classifiedAId`) REFERENCES `classifiedAs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouses_ibfk_407` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouses_ibfk_408` FOREIGN KEY (`employeeOf`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
