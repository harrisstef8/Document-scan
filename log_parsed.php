<?php
// log_parsed.php
require __DIR__ . '/history_log.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || !isset($data['fields'])) {
        throw new Exception('No parsed fields provided');
    }

    $docType = $data['docType'] ?? 'unknown';
    $fields  = $data['fields'] ?? [];

    // Γράφουμε στο history.log
    history_log('Parsed document fields', [
        'docType' => $docType,
        'fields'  => $fields,
    ]);

    echo json_encode([
        'success' => true,
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    history_log('Parsed document logging failed', [
        'error' => $e->getMessage(),
    ]);

    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
