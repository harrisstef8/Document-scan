<?php

function env_load($path) {
  if (!file_exists($path)) return [];

  $vars = [];
  $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

  foreach ($lines as $line) {
    $line = trim($line);
    if ($line === '' || str_starts_with($line, '#')) continue;

    $pos = strpos($line, '=');
    if ($pos === false) continue;

    $key = trim(substr($line, 0, $pos));
    $val = trim(substr($line, $pos + 1));

    // remove optional quotes
    if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
        (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
      $val = substr($val, 1, -1);
    }

    $vars[$key] = $val;
  }

  return $vars;
}

$env = env_load(__DIR__ . '/.env');

return [
  'APP_ENV' => $env['APP_ENV'] ?? 'demo',
  'GOOGLEVISION_API_KEY' => $env['GOOGLEVISION_API_KEY'] ?? '',
];
