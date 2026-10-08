-- Rollback for booking_time_proposal.sql.
ALTER TABLE `bookings`
  DROP COLUMN `previousOn`,
  DROP COLUMN `previousStartTime`,
  DROP COLUMN `previousEndTime`,
  DROP COLUMN `proposalComment`,
  DROP COLUMN `proposedAt`;
