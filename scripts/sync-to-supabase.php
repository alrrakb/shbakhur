<?php
header('Content-Type: application/json; charset=utf-8');

$supabaseUrl = 'https://tcmohnvzuguerexgcppus.supabase.co';
$serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbW9obnZ6dWd1ZXJ4Z2NwcHVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg5MDQ3MywiZXhwIjoyMDc0NDY2NDczfQ.3i6SJD5jv8uk9IctgjKLpCDOOVWyqmUvnvv0q0XWYBc';

$host = 'localhost';
$dbname = 'store_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'WordPress DB connection failed']);
    exit;
}

function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function supabaseRequest($endpoint, $method = 'GET', $body = null) {
    global $supabaseUrl, $serviceKey;
    
    $url = "$supabaseUrl/rest/v1/$endpoint";
    $ch = curl_init($url);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apikey: $serviceKey",
        "Authorization: Bearer $serviceKey",
        "Content-Type: application/json",
        "Prefer: return=representation"
    ]);
    
    if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($body) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

echo "=== Starting WordPress to Supabase Sync ===\n\n";

echo "Step 1: Syncing categories...\n";
$catSql = "
    SELECT t.term_id, t.name, t.slug, tt.taxonomy, tt.count
    FROM wp_terms t
    JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
    WHERE tt.taxonomy = 'product_cat'
    ORDER BY t.name ASC
";
$catStmt = $pdo->query($catSql);
$categories = $catStmt->fetchAll();

$categoryMap = [];
foreach ($categories as $cat) {
    $categoryData = [
        'wp_id' => (int)$cat['term_id'],
        'name' => $cat['name'],
        'slug' => $cat['slug'],
        'taxonomy' => $cat['taxonomy'],
        'count' => (int)$cat['count']
    ];
    
    $result = supabaseRequest('categories?wp_id=eq.' . $cat['term_id'], 'GET');
    if (!empty($result['body'])) {
        supabaseRequest('categories?wp_id=eq.' . $cat['term_id'], 'PATCH', $categoryData);
        echo "  - Updated category: {$cat['name']}\n";
    } else {
        supabaseRequest('categories', 'POST', $categoryData);
        echo "  - Created category: {$cat['name']}\n";
    }
    $categoryMap[$cat['term_id']] = $cat['slug'];
}

echo "\nStep 2: Syncing products...\n";
$productSql = "
    SELECT 
        p.ID as id,
        p.post_title as title,
        p.post_content as description,
        p.post_name as slug,
        COALESCE(pm_price.meta_value, 0) as price,
        COALESCE(pm_sale_price.meta_value, pm_price.meta_value, 0) as sale_price,
        COALESCE(pm_regular.meta_value, '') as regular_price,
        COALESCE(pm_sku.meta_value, '') as sku,
        COALESCE(pm_image.meta_value, '') as image_id
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm_price ON p.ID = pm_price.post_id AND pm_price.meta_key = '_price'
    LEFT JOIN wp_postmeta pm_sale_price ON p.ID = pm_sale_price.post_id AND pm_sale_price.meta_key = '_sale_price'
    LEFT JOIN wp_postmeta pm_regular ON p.ID = pm_regular.post_id AND pm_regular.meta_key = '_regular_price'
    LEFT JOIN wp_postmeta pm_sku ON p.ID = pm_sku.post_id AND pm_sku.meta_key = '_sku'
    LEFT JOIN wp_postmeta pm_image ON p.ID = pm_image.post_id AND pm_image.meta_key = '_thumbnail_id'
    WHERE p.post_type = 'product' AND p.post_status = 'publish'
    ORDER BY p.ID DESC
";
$productStmt = $pdo->query($productSql);
$products = $productStmt->fetchAll();

foreach ($products as $product) {
    $imageUrl = '';
    if (!empty($product['image_id'])) {
        $attSql = "SELECT guid FROM wp_posts WHERE ID = ? AND post_type = 'attachment'";
        $attStmt = $pdo->prepare($attSql);
        $attStmt->execute([$product['image_id']]);
        $attResult = $attStmt->fetch();
        if ($attResult) {
            $imageUrl = $attResult['guid'];
        }
    }
    
    $productData = [
        'wp_id' => (int)$product['id'],
        'title' => $product['title'],
        'description' => strip_tags($product['description']),
        'slug' => $product['slug'],
        'price' => $product['price'],
        'sale_price' => $product['sale_price'],
        'regular_price' => $product['regular_price'],
        'sku' => $product['sku'],
        'image' => $imageUrl
    ];
    
    $result = supabaseRequest('products?wp_id=eq.' . $product['id'], 'GET');
    if (!empty($result['body'])) {
        supabaseRequest('products?wp_id=eq.' . $product['id'], 'PATCH', $productData);
        echo "  - Updated product: {$product['title']}\n";
    } else {
        supabaseRequest('products', 'POST', $productData);
        echo "  - Created product: {$product['title']}\n";
    }
    
    $catRelSql = "
        SELECT tt.term_id
        FROM wp_term_relationships tr
        JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        WHERE tr.object_id = ? AND tt.taxonomy = 'product_cat'
    ";
    $catRelStmt = $pdo->prepare($catRelSql);
    $catRelStmt->execute([$product['id']]);
    $productCategories = $catRelStmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($productCategories as $termId) {
        $wpId = $termId;
        $catResult = supabaseRequest("categories?wp_id=eq.$wpId", 'GET');
        if (!empty($catResult['body'])) {
            $catId = $catResult['body'][0]['id'];
            $prodResult = supabaseRequest("products?wp_id=eq." . $product['id'], 'GET');
            if (!empty($prodResult['body'])) {
                $prodId = $prodResult['body'][0]['id'];
                
                $linkCheck = supabaseRequest("product_categories?product_id=eq.$prodId&category_id=eq.$catId", 'GET');
                if (empty($linkCheck['body'])) {
                    supabaseRequest('product_categories', 'POST', [
                        'product_id' => $prodId,
                        'category_id' => $catId
                    ]);
                }
            }
        }
    }
}

echo "\n=== Sync Complete ===\n";
echo json_encode(['success' => true, 'message' => 'Data synced successfully'], JSON_UNESCAPED_UNICODE);
