<?php
require_once 'db-connect.php';

$product_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($product_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid product ID']);
    exit;
}

$sql = "
    SELECT 
        p.ID as id,
        p.post_title as title,
        p.post_content as description,
        p.post_name as slug,
        COALESCE(pm_price.meta_value, 0) as price,
        COALESCE(pm_sale_price.meta_value, pm_price.meta_value, 0) as sale_price,
        COALESCE(pm_image.meta_value, '') as image_id,
        pm_regular.meta_value as regular_price,
        pm_sku.meta_value as sku
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm_price ON p.ID = pm_price.post_id AND pm_price.meta_key = '_price'
    LEFT JOIN wp_postmeta pm_sale_price ON p.ID = pm_sale_price.post_id AND pm_sale_price.meta_key = '_sale_price'
    LEFT JOIN wp_postmeta pm_image ON p.ID = pm_image.post_id AND pm_image.meta_key = '_thumbnail_id'
    LEFT JOIN wp_postmeta pm_regular ON p.ID = pm_regular.post_id AND pm_regular.meta_key = '_regular_price'
    LEFT JOIN wp_postmeta pm_sku ON p.ID = pm_sku.post_id AND pm_sku.meta_key = '_sku'
    WHERE p.ID = ? AND p.post_type = 'product' AND p.post_status = 'publish'
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$product_id]);
$product = $stmt->fetch();

if (!$product) {
    http_response_code(404);
    echo json_encode(['error' => 'Product not found']);
    exit;
}

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

$category_sql = "
    SELECT t.term_id, t.name, t.slug, tt.taxonomy
    FROM wp_term_relationships tr
    JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    JOIN wp_terms t ON tt.term_id = t.term_id
    WHERE tr.object_id = ? AND tt.taxonomy IN ('product_cat', 'product_tag')
";

$cat_stmt = $pdo->prepare($category_sql);
$cat_stmt->execute([$product_id]);
$categories = $cat_stmt->fetchAll();

echo json_encode([
    'success' => true,
    'product' => [
        'id' => (int)$product['id'],
        'title' => $product['title'],
        'description' => $product['description'],
        'slug' => $product['slug'],
        'price' => $product['price'],
        'sale_price' => $product['sale_price'],
        'regular_price' => $product['regular_price'],
        'sku' => $product['sku'],
        'image' => $image_url,
        'categories' => array_map(function($cat) {
            return [
                'id' => (int)$cat['term_id'],
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'taxonomy' => $cat['taxonomy']
            ];
        }, $categories)
    ]
], JSON_UNESCAPED_UNICODE);
