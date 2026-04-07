<?php
require_once 'db-connect.php';

$category_slug = isset($_GET['category']) ? sanitize($_GET['category']) : '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

if (empty($category_slug)) {
    http_response_code(400);
    echo json_encode(['error' => 'Category slug is required']);
    exit;
}

$term_sql = "SELECT term_id FROM wp_terms WHERE slug = ?";
$term_stmt = $pdo->prepare($term_sql);
$term_stmt->execute([$category_slug]);
$term = $term_stmt->fetch();

if (!$term) {
    http_response_code(404);
    echo json_encode(['error' => 'Category not found']);
    exit;
}

$term_id = $term['term_id'];

$product_ids_sql = "
    SELECT tr.object_id
    FROM wp_term_relationships tr
    JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    WHERE tt.term_id = ? AND tt.taxonomy = 'product_cat'
";

$ids_stmt = $pdo->prepare($product_ids_sql);
$ids_stmt->execute([$term_id]);
$product_ids = $ids_stmt->fetchAll(PDO::FETCH_COLUMN);

if (empty($product_ids)) {
    echo json_encode([
        'success' => true,
        'products' => [],
        'category' => [
            'id' => $term_id,
            'slug' => $category_slug
        ],
        'total' => 0
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$placeholders = implode(',', array_fill(0, count($product_ids), '?'));
$products_sql = "
    SELECT 
        p.ID as id,
        p.post_title as title,
        p.post_content as description,
        p.post_name as slug,
        COALESCE(pm_price.meta_value, 0) as price,
        COALESCE(pm_sale_price.meta_value, pm_price.meta_value, 0) as sale_price,
        COALESCE(pm_image.meta_value, '') as image_id
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm_price ON p.ID = pm_price.post_id AND pm_price.meta_key = '_price'
    LEFT JOIN wp_postmeta pm_sale_price ON p.ID = pm_sale_price.post_id AND pm_sale_price.meta_key = '_sale_price'
    LEFT JOIN wp_postmeta pm_image ON p.ID = pm_image.post_id AND pm_image.meta_key = '_thumbnail_id'
    WHERE p.ID IN ($placeholders) AND p.post_type = 'product' AND p.post_status = 'publish'
    ORDER BY p.ID DESC
    LIMIT ? OFFSET ?
";

$params = array_merge($product_ids, [$limit, $offset]);
$products_stmt = $pdo->prepare($products_sql);
$products_stmt->execute($params);
$products = $products_stmt->fetchAll();

$formatted = [];
foreach ($products as $product) {
    $image_url = '';
    if (!empty($product['image_id'])) {
        $att_sql = "SELECT guid FROM wp_posts WHERE ID = ? AND post_type = 'attachment'";
        $att_stmt = $pdo->prepare($att_sql);
        $att_stmt->execute([$product['image_id']]);
        $att_result = $att_stmt->fetch();
        if ($att_result) {
            $image_url = $att_result['guid'];
        }
    }

    $formatted[] = [
        'id' => (int)$product['id'],
        'title' => $product['title'],
        'description' => strip_tags($product['description']),
        'slug' => $product['slug'],
        'price' => $product['price'],
        'sale_price' => $product['sale_price'],
        'image' => $image_url
    ];
}

echo json_encode([
    'success' => true,
    'products' => $formatted,
    'category' => [
        'id' => $term_id,
        'slug' => $category_slug
    ],
    'total' => count($formatted)
], JSON_UNESCAPED_UNICODE);
