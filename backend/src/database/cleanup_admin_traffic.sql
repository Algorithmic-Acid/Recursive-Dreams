-- Clean up existing admin traffic from the regular traffic_logs table
-- This removes any logs where the user_id belongs to an admin user

DELETE FROM traffic_logs
WHERE user_id IN (
  SELECT id FROM users WHERE is_admin = true
);

-- Show how many records were cleaned up
SELECT COUNT(*) as admin_logs_removed FROM traffic_logs WHERE user_id IS NULL;
