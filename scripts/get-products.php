<?php
require_once 'db-connect.php';

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$sql = "
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
    WHERE p.post_type = 'product' 
    AND p.post_status = 'publish'
    ORDER BY p.ID DESC
    LIMIT ? OFFSET ?
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$limit, $offset]);
$products = $stmt->fetchAll();

$category_sql = "
    SELECT tr.object_id, t.term_id, t.name, t.slug, tt.taxonomy
    FROM wp_term_relationships tr
    JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    JOIN wp_terms t ON tt.term_id = t.term_id
    WHERE tt.taxonomy IN ('product_cat', 'product_tag')
";

$category_stmt = $pdo->query($category_sql);
$categories = $category_stmt->fetchAll();

$category_map = [];
foreach ($categories as $cat) {
    $oid = $cat['object_id'];
    if (!isset($category_map[$oid])) {
        $category_map[$oid] = [];
    }
    $category_map[$oid][] = [
        'id' => $cat['term_id'],
        'name' => $cat['name'],
        'slug' => $cat['slug'],
        'taxonomy' => $cat['taxonomy']
    ];
}

$attachment_sql = "
    SELECT p.ID, p.guid
    FROM wp_posts p
    WHERE p.post_type = 'attachment'
    AND p.ID IN (
        SELECT meta_value FROM wp_postmeta WHERE meta_key = '_thumbnail_id'
    )
";

$attachment_stmt = $pdo->query($attachment_sql);
$attachments = $attachment_stmt->fetchAll();

$attachment_map = [];
foreach ($attachments as $att) {
    $attachment_map[$att['ID']] = $att['guid'];
}

$formatted = [];
foreach ($products as $product) {
    $image_url = '';
    if (!empty($product['image_id'])) {
        if (isset($attachment_map[$product['image_id']])) {
            $image_url = $attachment_map[$product['image_id']];
        } else {
            $att_sql = "SELECT guid FROM wp_posts WHERE ID = ? AND post_type = 'attachment'";
            $att_stmt = $pdo->prepare($att_sql);
            $att_stmt->execute([$product['image_id']]);
            $att_result = $att_stmt->fetch();
            if ($att_result) {
                $image_url = $att_result['guid'];
            }
        }
    }
    
    $formatted[] = [
        'id' => (int)$product['id'],
        'title' => $product['title'],
        'description' => strip_tags($product['description']),
        'slug' => $product['slug'],
        'price' => $product['price'],
        'sale_price' => $product['sale_price'],
        'image' => $image_url,
        'categories' => $category_map[$product['id']] ?? []
    ];
}

echo json_encode([
    'success' => true,
    'products' => $formatted,
    'total' => count($formatted)
], JSON_UNESCAPED_UNICODE);
