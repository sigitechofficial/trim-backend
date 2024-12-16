SET
    SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

SET
    AUTOCOMMIT = 0;

START TRANSACTION;

SET
    time_zone = "+00:00";

-- Dumping Data into user Types
INSERT INTO
    `usertypes` (`id`, `name`, `createdAt`, `updatedAt`)
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
    `servicetype` (`id`, `typeName`, `createdAt`, `updatedAt`)
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
-- Dumping into users (guest user)
-- INSERT INTO
--     `users` (`id`, `email`,`countryCode`, `createdAt`, `updatedAt`)
-- VALUES
--     (
--         1,
--         'guestuser@gmail.com',
--         NULL,
--         '2022-07-04 17:21:11',
--         '2022-07-04 17:21:11'
        
--     );

--
-- Dumping data for table `links`
--
INSERT INTO
    `links` (
        `id`,
        `title`,
        `key`,
        `link`,
        `status`,
        `createdAt`,
        `updatedAt`
    )
VALUES
    (
        1,
        'Privacy Policy',
        'privacyPolicy',
        'https://trim.com/privacy.html',
        1,
        '2023-02-15 15:26:52',
        '2023-02-15 15:26:52'
    ),
    (
        2,
        'FAQs',
        'FAQ',
        'https://trim.com',
        1,
        '2023-02-15 15:26:52',
        '2023-02-15 15:26:52'
    );

--
-- Dumping data for table `supports`
--
INSERT INTO
    `supports` (
        `id`,
        `title`,
        `key`,
        `value`,
        `status`,
        `createdAt`,
        `updatedAt`
    )
VALUES
    (
        1,
        'email',
        'support_email',
        'support@gmail.com',
        1,
        '2023-02-06 10:51:06',
        '2023-04-13 10:42:30'
    ),
    (
        2,
        'phone',
        'support_phone',
        '+923117860111',
        1,
        '2023-02-06 10:51:06',
        '2023-03-01 11:30:24'
    );

-- Dumping data for table `supports`
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