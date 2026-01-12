<?php
require __DIR__ . '/history_log.php';
$config = require __DIR__ . '/config.php'; 

// vision.php
header('Content-Type: application/json; charset=utf-8');

$response = [
    'success' => false,
    'text'    => '',
    'error'   => null,
];

$text = ''; // για να το έχουμε διαθέσιμο και εκτός try

try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || empty($data['imageDataUrl'])) {
        throw new Exception('No imageDataUrl provided');
    }

    $imageDataUrl = $data['imageDataUrl'];

    // Αφαιρούμε το prefix "data:image/...;base64,"
    if (strpos($imageDataUrl, 'base64,') !== false) {
        $base64 = substr($imageDataUrl, strpos($imageDataUrl, 'base64,') + 7);
    } else {
        $base64 = $imageDataUrl;
    }

    $requestBody = [
        'requests' => [
            [
                'image' => [
                    'content' => $base64,
                ],
                'features' => [
                    [
                        'type'       => 'DOCUMENT_TEXT_DETECTION',
                        'maxResults' => 1,
                    ],
                ],
            ],
        ],
    ];

    $apiKey = $config['GOOGLEVISION_API_KEY'];; // <-- Ιδανικά βάλ'το σε .env ή config
    $url    = 'https://vision.googleapis.com/v1/images:annotate?key=' . urlencode($apiKey);

    if (!$apiKey) {
        http_response_code(500);
        echo "Missing OPENAI_API_KEY (set it in .env on server).";
        exit;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json; charset=utf-8',
        ],
        CURLOPT_POSTFIELDS     => json_encode($requestBody),
    ]);

    $result = curl_exec($ch);
    if ($result === false) {
        throw new Exception('cURL error: ' . curl_error($ch));
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 300) {
        throw new Exception('Vision API HTTP error: ' . $httpCode . ' Response: ' . $result);
    }

    $visionResponse = json_decode($result, true);

    if (isset($visionResponse['responses'][0]['fullTextAnnotation']['text'])) {
        $text = $visionResponse['responses'][0]['fullTextAnnotation']['text'];
    } elseif (isset($visionResponse['responses'][0]['textAnnotations'][0]['description'])) {
        $text = $visionResponse['responses'][0]['textAnnotations'][0]['description'];
    } else {
        $text = '';
    }

    $response['success'] = true;
    $response['text']    = $text;

    // LOG επιτυχούς OCR
    history_log('OCR completed', [
        'length'  => strlen($text),
        'snippet' => mb_substr($text, 0, 120, 'UTF-8') . (strlen($text) > 120 ? '...' : ''),
    ]);

} catch (Throwable $e) {
    $response['error'] = $e->getMessage();

    // LOG αποτυχημένου OCR
    history_log('OCR failed', [
        'error' => $e->getMessage(),
    ]);
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
