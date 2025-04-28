SET
    SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

SET
    AUTOCOMMIT = 0;

START TRANSACTION;

SET
    time_zone = "+00:00";

-- Dumping Data into user Types
INSERT INTO
    `userTypes` (`id`, `name`, `createdAt`, `updatedAt`)
VALUES
    (
        1,
        'Customer',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    ),
    (
        2,
        'Salon',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    ),
    (
        3,
        'Employee',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    ),
    (
        4,
        'Admin',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    );
-- Dumping Data into user Types
INSERT INTO
    `serviceTypes` (`id`, `typeName`, `createdAt`, `updatedAt`)
VALUES
    (
        1,
        'hair cut',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    ),
    (
        2,
        'beard cut',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    ),
    (
        3,
        'beard & hair cut',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    ),
    (
        4,
        'rought cut',
        '2022-07-04 17:21:11',
        '2022-07-04 17:21:11'
    );
-- Dumping into users (Admin user)
INSERT INTO `users` (`id`, `firstName`, `lastName`, `password`, `email`, `countryCode`, `phoneNum`, `status`, `verifiedAt`, `stripeCustomerId`, `dvToken`, `image`, `deletedAt`, `signedFrom`, `createdAt`, `updatedAt`, `userTypeId`, `roleId`, `deleted`, `isExternalEmployee`) VALUES
(1, 'Admin', '', '$2a$12$OzUvzIEruX3UWOgjwYTae.eb0GhMXliJP1/lD7uNU5IJvx282QKa6', 'admin@gmail.com', '+92', '9933932903', 1, '2023-12-14 10:53:52', '', '', '', NULL, 'email', '2023-12-11 10:15:29', '2025-01-03 10:41:09', 4, NULL, 0, 0);


--
-- Dumping data for table `supports`
--
INSERT INTO `helpSupports` (`id`, `email`, `countryCode`, `phoneNum`, `address`, `createdAt`, `updatedAt`) VALUES
(1, 'support@trimworldwide.co.uk', '92', '2983909231', '123 Lane park, London', '2024-02-14 10:18:11', '2025-04-22 09:50:23');

--
-- Dumping data for table `wagesMethods`
--
INSERT INTO
    `wagesMethods` (
        `id`,
       `methodName`,
        `createdAt`,
        `updatedAt`
    )
VALUES
    (
        1,
        'Commission',
        '2023-02-06 10:51:06',
        '2023-04-13 10:42:30'
    ),
    (
        2,
        'Fixed Salary (per month)',
        '2023-02-06 10:51:06',
        '2023-04-13 10:42:30'
    ),
    (
        3,
        'Rent a chair',
        '2023-02-06 10:51:06',
        '2023-04-13 10:42:30'
    );

    -- seeders
    COMMIT;