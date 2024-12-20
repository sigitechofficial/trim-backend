<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Path to your working directory
$workingDir = '/home/trimworldwide/stage.trimworldwide.com';

// Absolute paths to node and PM2 binaries
$nodePath = '/bin/node';
$pm2Path = '/bin/pm2';

// Define the process name
$processName = 'thetrim.js';

// PM2 commands with absolute paths
$pm2StopDeleteCommand = "$pm2Path stop $processName || true && $pm2Path delete $processName || true";
$pm2CreateCommand = "$nodePath /bin/npm install && $pm2Path start $processName";
$pm2SaveCommand = "$pm2Path save";

// Combine all commands
$command = "cd $workingDir && $pm2StopDeleteCommand && $pm2CreateCommand && $pm2SaveCommand 2>&1";

// Execute the command and capture the output
$output = shell_exec($command);

// Output the result for debugging
echo "<pre>";
echo "Command Output:\n";
echo htmlspecialchars($output);
echo "</pre>";
?>
