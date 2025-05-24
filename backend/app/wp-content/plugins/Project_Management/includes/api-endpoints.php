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

    // Endpoint para crear un nuevo pedido
    register_rest_route('pm/v1', '/pedidos', array(
        'methods' => 'POST',
        'callback' => 'create_pedido',
        'permission_callback' => function() {
            return is_user_logged_in();
        },
        'args' => array(
            'cliente_id' => array(
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint'
            ),
            'productos' => array(
                'required' => true,
                'type' => 'array',
                'items' => array(
                    'type' => 'object',
                    'properties' => array(
                        'producto_id' => array(
                            'type' => 'integer',
                            'required' => true
                        ),
                        'cantidad' => array(
                            'type' => 'integer',
                            'required' => true
                        )
                    )
                )
            )
        )
    ));

    // Endpoint para obtener pedidos por cliente
    register_rest_route('pm/v1', '/clientes/(?P<id>\d+)/pedidos', array(
        'methods' => 'GET',
        'callback' => 'get_client_orders',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ));

    // Endpoint para obtener todos los pedidos
    register_rest_route('pm/v1', '/pedidos', array(
        'methods' => 'GET',
        'callback' => 'get_pedidos',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    // Endpoint para actualizar estado del pedido
    register_rest_route('pm/v1', '/pedidos/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'update_pedido_status',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));

    // Endpoint para eliminar un pedido
    register_rest_route('pm/v1', '/pedidos/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'delete_pedido',
        'permission_callback' => function() {
            return current_user_can('delete_posts');
        }
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

// Función para obtener pedidos por cliente
function get_client_orders($request) {
    $cliente_id = $request['id'];
    
    $args = array(
        'post_type' => 'pedidos',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => array(
            array(
                'key' => 'cliente_id',
                'value' => $cliente_id
            )
        )
    );

    $pedidos = get_posts($args);
    $response = array();

    foreach ($pedidos as $pedido) {
        $response[] = array(
            'id' => $pedido->ID,
            'title' => $pedido->post_title,
            'date' => $pedido->post_date,
            'modified' => $pedido->post_modified,
            'meta' => array(
                'cliente' => array(
                    'id' => $cliente_id,
                    'nombre' => get_the_title($cliente_id)
                ),
                'productos' => get_post_meta($pedido->ID, 'productos', true),
                'total' => get_post_meta($pedido->ID, 'total', true),
                'estado' => get_post_meta($pedido->ID, 'estado', true)
            )
        );
    }

    return $response;
}

// Función para obtener todos los pedidos
function get_pedidos() {
    // Agregar headers CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Credentials: true');

    // Manejar preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit();
    }

    $args = array(
        'post_type' => 'pedidos',
        'posts_per_page' => -1,
        'post_status' => 'publish'
    );

    $pedidos = get_posts($args);
    $response = array();

    foreach ($pedidos as $pedido) {
        $cliente_id = get_post_meta($pedido->ID, 'cliente_id', true);
        $cliente = get_post($cliente_id);
        
        $response[] = array(
            'id' => $pedido->ID,
            'title' => $pedido->post_title,
            'date' => $pedido->post_date,
            'modified' => $pedido->post_modified,
            'meta' => array(
                'cliente' => array(
                    'id' => $cliente_id,
                    'nombre' => $cliente ? $cliente->post_title : 'Cliente no encontrado'
                ),
                'productos' => get_post_meta($pedido->ID, 'productos', true),
                'total' => get_post_meta($pedido->ID, 'total', true),
                'estado' => get_post_meta($pedido->ID, 'estado', true)
            )
        );
    }

    return $response;
}

// Función para actualizar estado del pedido
function update_pedido_status($request) {
    try {
        error_log('Starting update_pedido_status function...');
        
        // Verificar autenticación
        if (!is_user_logged_in()) {
            error_log('User is not logged in');
            return new WP_Error('unauthorized', 'Usuario no autenticado', array('status' => 401));
        }

        // Verificar permisos
        if (!current_user_can('edit_posts')) {
            error_log('User does not have required permissions');
            return new WP_Error('forbidden', 'No tiene permisos para actualizar pedidos', array('status' => 403));
        }

        $id = $request['id'];
        $params = $request->get_params();
        
        error_log('Updating order ' . $id . ' with params: ' . print_r($params, true));
        
        // Verificar que el pedido existe
        $pedido = get_post($id);
        if (!$pedido || $pedido->post_type !== 'pedidos') {
            error_log('Order not found or invalid type: ' . $id);
            return new WP_Error('not_found', 'Pedido no encontrado', array('status' => 404));
        }

        if (empty($params['estado'])) {
            error_log('Missing estado parameter');
            return new WP_Error('missing_status', 'El estado es requerido', array('status' => 400));
        }

        // Validar que el estado sea válido
        $estados_validos = array('pendiente', 'servido');
        if (!in_array($params['estado'], $estados_validos)) {
            error_log('Invalid status: ' . $params['estado']);
            return new WP_Error('invalid_status', 'Estado no válido', array('status' => 400));
        }

        // Actualizar el estado
        $update_result = update_post_meta($id, 'estado', $params['estado']);
        
        if ($update_result === false) {
            error_log('Failed to update order status');
            return new WP_Error('update_failed', 'Error al actualizar el estado del pedido', array('status' => 500));
        }

        error_log('Order status updated successfully');
        
        return array(
            'id' => $id,
            'estado' => $params['estado'],
            'message' => 'Estado del pedido actualizado correctamente'
        );

    } catch (Exception $e) {
        error_log('Exception in update_pedido_status: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
        return new WP_Error('server_error', 'Error interno del servidor: ' . $e->getMessage(), array('status' => 500));
    }
}

// Función para eliminar un pedido
function delete_pedido($request) {
    try {
        error_log('Starting delete_pedido function...');
        
        $id = $request['id'];
        error_log('Attempting to delete order with ID: ' . $id);
        
        // Verificar que el pedido existe
        $pedido = get_post($id);
        if (!$pedido || $pedido->post_type !== 'pedidos') {
            error_log('Order not found or invalid type: ' . $id);
            return new WP_Error('not_found', 'Pedido no encontrado', array('status' => 404));
        }

        // Verificar permisos
        if (!current_user_can('delete_posts')) {
            error_log('User does not have permission to delete orders');
            return new WP_Error('permission_denied', 'No tiene permisos para eliminar pedidos', array('status' => 403));
        }

        // Eliminar el pedido
        $result = wp_delete_post($id, true);
        
        if (!$result) {
            error_log('Failed to delete order: ' . $id);
            return new WP_Error('delete_failed', 'Error al eliminar el pedido', array('status' => 500));
        }

        error_log('Order deleted successfully: ' . $id);
        return array(
            'success' => true,
            'message' => 'Pedido eliminado correctamente',
            'id' => $id
        );

    } catch (Exception $e) {
        error_log('Exception in delete_pedido: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
        return new WP_Error('server_error', 'Error interno del servidor: ' . $e->getMessage(), array('status' => 500));
    }
}

// Función para crear un nuevo pedido
function create_pedido($request) {
    try {
        $params = $request->get_params();
        
        // Validar cliente_id
        if (empty($params['cliente_id'])) {
            return new WP_Error('missing_fields', 'El cliente es requerido', array('status' => 400));
        }

        // Validar productos
        if (empty($params['productos']) || !is_array($params['productos'])) {
            return new WP_Error('missing_fields', 'Los productos son requeridos', array('status' => 400));
        }

        // Verificar que el cliente existe
        $cliente = get_post($params['cliente_id']);
        if (!$cliente) {
            return new WP_Error('invalid_client', 'Cliente no encontrado', array('status' => 400));
        }

        // Crear el post del pedido
        $post_data = array(
            'post_title'    => 'Pedido #' . time(),
            'post_status'   => 'publish',
            'post_type'     => 'pedidos',
            'post_author'   => get_current_user_id()
        );

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        // Calcular el total del pedido
        $total = 0;
        $productos_data = array();

        foreach ($params['productos'] as $producto) {
            if (empty($producto['producto_id']) || empty($producto['cantidad'])) {
                continue;
            }

            $producto_post = get_post($producto['producto_id']);
            if (!$producto_post) {
                continue;
            }

            $precio = get_post_meta($producto['producto_id'], 'precio', true);
            if (!$precio) {
                continue;
            }

            $cantidad = intval($producto['cantidad']);
            $precio_unitario = floatval($precio);
            $subtotal = $precio_unitario * $cantidad;
            $total += $subtotal;

            $productos_data[] = array(
                'producto_id' => strval($producto['producto_id']),
                'cantidad' => $cantidad,
                'precio_unitario' => $precio_unitario,
                'subtotal' => $subtotal
            );
        }

        // Guardar los campos personalizados
        update_post_meta($post_id, 'cliente_id', $params['cliente_id']);
        update_post_meta($post_id, 'productos', $productos_data);
        update_post_meta($post_id, 'total', $total);
        update_post_meta($post_id, 'estado', 'pendiente');

        // Obtener y devolver el pedido creado
        $pedido = get_post($post_id);
        $response = array(
            'id' => $pedido->ID,
            'title' => $pedido->post_title,
            'meta' => array(
                'cliente' => array(
                    'id' => $params['cliente_id'],
                    'nombre' => $cliente->post_title
                ),
                'productos' => $productos_data,
                'total' => $total,
                'estado' => 'pendiente'
            )
        );

        return rest_ensure_response($response);

    } catch (Exception $e) {
        return new WP_Error('server_error', 'Error interno del servidor: ' . $e->getMessage(), array('status' => 500));
    }
} 