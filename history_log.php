<?php
// history_log.php

date_default_timezone_set('Europe/Athens');

function history_log(string $message, array $context = []): void
{
    // Φάκελος logs στο ίδιο level με τα PHP (vision.php κλπ)
    $logDir = __DIR__ . DIRECTORY_SEPARATOR . 'logs';

    // Αν δεν υπάρχει, προσπάθησε να τον δημιουργήσεις
    if (!is_dir($logDir)) {
        $ok = mkdir($logDir, 0777, true);
        if (!$ok && !is_dir($logDir)) {
            // Γράψε στο PHP error_log για να ξέρουμε τι έγινε
            error_log('history_log: Αποτυχία δημιουργίας φακέλου: ' . $logDir);
            return;
        }
    }

    $logFile = $logDir . DIRECTORY_SEPARATOR . 'history.log';

    $entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'message'   => $message,
        'context'   => $context,
        'ip'        => $_SERVER['REMOTE_ADDR'] ?? null,
    ];

    $line = json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL;

    // Χωρίς @, για να δούμε αν υπάρχει πρόβλημα
    $result = file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);

    if ($result === false) {
        error_log('history_log: Αποτυχία εγγραφής στο αρχείο: ' . $logFile);
    }
}
