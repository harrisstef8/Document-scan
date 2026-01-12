<?php
require __DIR__ . '/history_log.php';

history_log('TEST ENTRY', [
    'foo' => 'bar',
    'time' => time(),
]);

echo 'OK';
