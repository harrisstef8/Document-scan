<?php
// save.php
require __DIR__ . '/history_log.php';

header('Content-Type: application/json; charset=utf-8');

$response = [
    'success' => false,
    'file'    => null,
    'error'   => null,
];

// Φάκελος images ΔΙΠΛΑ στο save.php
$baseDir = __DIR__ . '/images';

if (!is_dir($baseDir)) {
    if (!mkdir($baseDir, 0777, true)) {
        $response['error'] = 'Cannot create images folder: ' . $baseDir;
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if (empty($_FILES['image'])) {
    $response['error'] = 'No image field in $_FILES';
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    $response['error'] = 'Upload error code: ' . $file['error'];
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
if ($ext === '') {
    $ext = 'png'; // default, αν δεν έρθει extension
}

$newName = 'ocr-' . date('Ymd-His') . '-' . uniqid() . '.' . $ext;
$target  = $baseDir . '/' . $newName;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    $response['error'] = 'move_uploaded_file failed';
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

$response['success'] = true;
$response['file'] = [
    'name' => $newName,
    'path' => $target,
];

history_log('Image saved', [
    'file' => $savedFileName ?? null,
]);

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
