<?php
/**
 * Endpoints de la API para Clientes y Productos
 */

// Función para verificar permisos
function pm_check_permissions() {
    // Verificar si el usuario está autenticado
    if (!is_user_logged_in()) {
        error_log('User is not logged in');
        return false;
    }

    $user = wp_get_current_user();
    error_log('Checking permissions for user: ' . $user->ID);
    error_log('User roles: ' . print_r($user->roles, true));
    error_log('User capabilities: ' . print_r($user->allcaps, true));
    
    // Verificar si el usuario tiene el rol super_administrador
    if (in_array('super_administrador', (array)$user->roles)) {
        error_log('User has super_administrador role');
        return true;
    }
    
    // Verificar si el usuario tiene permisos de administrador
    if (user_can($user->ID, 'manage_options')) {
        error_log('User has manage_options capability');
        return true;
    }
    
    // Verificar si el usuario tiene permisos para editar posts
    if (user_can($user->ID, 'edit_posts')) {
        error_log('User has edit_posts capability');
        return true;
    }
    
    error_log('User does not have required permissions');
    return false;
}

// Registrar rutas de la API REST
add_action('rest_api_init', function () {
    // Endpoint para crear un nuevo cliente
    register_rest_route('pm/v1', '/clientes', array(
        'methods' => 'POST',
        'callback' => 'create_cliente',
        'permission_callback' => 'pm_check_permissions'
    ));

    // Endpoint para obtener todos los clientes
    register_rest_route('pm/v1', '/clientes', array(
        'methods' => 'GET',
        'callback' => 'get_clientes',
        'permission_callback' => 'pm_check_permissions'
    ));

    // Endpoint para eliminar un cliente
    register_rest_route('pm/v1', '/clientes/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_cliente',
        'permission_callback' => 'pm_check_permissions'
    ));

    // Endpoint para crear un nuevo producto
    register_rest_route('pm/v1', '/productos', array(
        'methods' => 'POST',
        'callback' => 'create_producto',
        'permission_callback' => 'pm_check_permissions'
    ));

    // Endpoint para obtener todos los productos
    register_rest_route('pm/v1', '/productos', array(
        'methods' => 'GET',
        'callback' => 'get_productos',
        'permission_callback' => 'pm_check_permissions'
    ));

    // Endpoint para eliminar un producto
    register_rest_route('pm/v1', '/productos/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_producto',
        'permission_callback' => 'pm_check_permissions'
    ));
});

// Función para crear un nuevo cliente
function create_cliente($request) {
    $params = $request->get_params();
    
    // Validar campos requeridos
    if (empty($params['title']) || empty($params['meta']['email'])) {
        return new WP_Error('missing_fields', 'El nombre y el email son campos requeridos', array('status' => 400));
    }

    // Crear el post del cliente
    $post_data = array(
        'post_title'    => sanitize_text_field($params['title']),
        'post_content'  => sanitize_textarea_field($params['content']),
        'post_status'   => 'publish',
        'post_type'     => 'cliente',
        'post_author'   => get_current_user_id()
    );

    $post_id = wp_insert_post($post_data);

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    // Guardar los campos personalizados
    update_post_meta($post_id, 'email', sanitize_email($params['meta']['email']));
    update_post_meta($post_id, 'telefono', sanitize_text_field($params['meta']['telefono']));
    update_post_meta($post_id, 'direccion', sanitize_text_field($params['meta']['direccion']));

    return get_post($post_id);
}

// Función para obtener todos los clientes
function get_clientes() {
    $args = array(
        'post_type' => 'cliente',
        'posts_per_page' => -1,
        'post_status' => 'publish'
    );

    $clientes = get_posts($args);
    $response = array();

    foreach ($clientes as $cliente) {
        $response[] = array(
            'id' => $cliente->ID,
            'title' => $cliente->post_title,
            'content' => $cliente->post_content,
            'meta' => array(
                'email' => get_post_meta($cliente->ID, 'email', true),
                'telefono' => get_post_meta($cliente->ID, 'telefono', true),
                'direccion' => get_post_meta($cliente->ID, 'direccion', true)
            )
        );
    }

    return $response;
}

// Función para eliminar un cliente
function delete_cliente($request) {
    $id = $request['id'];
    
    if (!get_post($id)) {
        return new WP_Error('not_found', 'Cliente no encontrado', array('status' => 404));
    }

    $result = wp_delete_post($id, true);

    if (!$result) {
        return new WP_Error('delete_failed', 'Error al eliminar el cliente', array('status' => 500));
    }

    return array('success' => true);
}

// Función para crear un nuevo producto
function create_producto($request) {
    $params = $request->get_params();
    error_log('Received product data: ' . print_r($params, true));
    
    // Validar campos requeridos
    if (empty($params['title'])) {
        error_log('Missing title field');
        return new WP_Error('missing_title', 'El nombre del producto es requerido', array('status' => 400));
    }

    if (empty($params['meta']) || empty($params['meta']['precio'])) {
        error_log('Missing price field');
        return new WP_Error('missing_price', 'El precio del producto es requerido', array('status' => 400));
    }

    // Crear el post del producto
    $post_data = array(
        'post_title'    => sanitize_text_field($params['title']),
        'post_content'  => isset($params['content']) ? sanitize_textarea_field($params['content']) : '',
        'post_status'   => 'publish',
        'post_type'     => 'producto',
        'post_author'   => get_current_user_id()
    );

    error_log('Creating product with data: ' . print_r($post_data, true));

    $post_id = wp_insert_post($post_data);

    if (is_wp_error($post_id)) {
        error_log('Error creating product: ' . $post_id->get_error_message());
        return $post_id;
    }

    // Guardar los campos personalizados
    $precio = floatval($params['meta']['precio']);
    $stock = isset($params['meta']['stock']) ? intval($params['meta']['stock']) : 0;

    update_post_meta($post_id, 'precio', $precio);
    update_post_meta($post_id, 'stock', $stock);

    error_log('Product created successfully with ID: ' . $post_id);

    // Obtener y devolver el producto creado
    $producto = get_post($post_id);
    $response = array(
        'id' => $producto->ID,
        'title' => $producto->post_title,
        'content' => $producto->post_content,
        'meta' => array(
            'precio' => $precio,
            'stock' => $stock
        )
    );

    return rest_ensure_response($response);
}

// Función para obtener todos los productos
function get_productos() {
    $args = array(
        'post_type' => 'producto',
        'posts_per_page' => -1,
        'post_status' => 'publish'
    );

    $productos = get_posts($args);
    $response = array();

    foreach ($productos as $producto) {
        $response[] = array(
            'id' => $producto->ID,
            'title' => $producto->post_title,
            'content' => $producto->post_content,
            'meta' => array(
                'precio' => get_post_meta($producto->ID, 'precio', true),
                'stock' => get_post_meta($producto->ID, 'stock', true)
            )
        );
    }

    return $response;
}

// Función para eliminar un producto
function delete_producto($request) {
    $id = $request['id'];
    
    if (!get_post($id)) {
        return new WP_Error('not_found', 'Producto no encontrado', array('status' => 404));
    }

    $result = wp_delete_post($id, true);

    if (!$result) {
        return new WP_Error('delete_failed', 'Error al eliminar el producto', array('status' => 500));
    }

    return array('success' => true);
} 