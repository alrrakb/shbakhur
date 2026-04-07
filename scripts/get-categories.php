<?php
require_once 'db-connect.php';

$taxonomy = isset($_GET['taxonomy']) ? sanitize($_GET['taxonomy']) : 'product_cat';

$sql = "
    SELECT t.term_id, t.name, t.slug, t.description, tt.taxonomy, tt.count
    FROM wp_terms t
    JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
    WHERE tt.taxonomy = ?
    ORDER BY t.name ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$taxonomy]);
$categories = $stmt->fetchAll();

$formatted = array_map(function($cat) {
    return [
        'id' => (int)$cat['term_id'],
        'name' => $cat['name'],
        'slug' => $cat['slug'],
        'taxonomy' => $cat['taxonomy'],
        'count' => (int)$cat['count']
    ];
}, $categories);

echo json_encode([
    'success' => true,
    'categories' => $formatted,
    'total' => count($formatted)
], JSON_UNESCAPED_UNICODE);
